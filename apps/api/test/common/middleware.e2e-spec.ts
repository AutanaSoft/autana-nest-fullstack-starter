import { Controller, Get, Logger } from "@nestjs/common"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { apiBasePath } from "@autana/contracts/api"
import { errorResponseSchema } from "@autana/contracts/errors"
import supertest from "supertest"

import { Public } from "../../src/modules/auth/decorators/public.decorator.js"
import { createTestApp } from "../support/test-app.js"
import { createClient, webOrigin } from "../support/test-client.js"

// Ruta de prueba con una respuesta lo bastante grande para que se comprima.
@Public()
@Controller("test")
class LargeResponseController {
  @Get("large")
  large() {
    return "a".repeat(2000)
  }
}

describe("middleware", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp({ controllers: [LargeResponseController] })
    client = createClient(app)
  })

  afterEach(() => vi.restoreAllMocks())
  afterAll(() => app.close())

  describe("compresión", () => {
    it("comprime las respuestas grandes con gzip", async () => {
      const response = await client.request("/test/large", {
        headers: { "Accept-Encoding": "gzip" },
      })

      expect(response.status).toBe(200)
      expect(response.headers["content-encoding"]).toBe("gzip")
    })

    it("no comprime si el cliente no lo acepta", async () => {
      const response = await client.request("/test/large", {
        headers: { "Accept-Encoding": "identity" },
      })

      expect(response.headers["content-encoding"]).toBeUndefined()
    })
  })

  describe("cabeceras de seguridad", () => {
    it("las añade a las respuestas de la API", async () => {
      const response = await client.request("/health")

      expect(response.headers["x-content-type-options"]).toBe("nosniff")
      expect(response.headers["x-frame-options"]).toBeTruthy()
    })
  })

  describe("CORS", () => {
    it("responde al preflight del origen del frontend con cookies", async () => {
      const response = await client.request("/health", {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Method": "POST" },
      })

      expect(response.headers["access-control-allow-origin"]).toBe(webOrigin)
      expect(response.headers["access-control-allow-credentials"]).toBe("true")
    })

    it("no autoriza un origen ajeno", async () => {
      const response = await client.request("/health", {
        headers: { Origin: "https://evil.example" },
      })

      expect(response.headers["access-control-allow-origin"]).not.toBe("https://evil.example")
    })

    it("expone X-Request-Id al navegador", async () => {
      const response = await client.request("/health")

      expect(response.headers["access-control-expose-headers"]).toContain("X-Request-Id")
    })
  })

  describe("protección CSRF", () => {
    it("rechaza una petición que cambia estado desde otro origen, también en las rutas de autenticación", async () => {
      for (const path of ["/tasks", "/auth/sign-in/email"]) {
        const response = await client.request(path, {
          method: "POST",
          body: {},
          headers: { Origin: "https://evil.example" },
        })

        expect(response.status).toBe(403)
        expect(errorResponseSchema.parse(response.body)).toMatchObject({
          statusCode: 403,
        })
      }
    })

    it("rechaza un formulario de otro origen", async () => {
      const response = await client
        .request("/tasks", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        })
        .type("form")
        .send("title=x")

      expect(response.status).toBe(403)
    })

    it("rechaza una petición de otro sitio según Sec-Fetch-Site, aunque no envíe Origin", async () => {
      const response = await supertest(app.getHttpServer())
        .post(`${apiBasePath}/tasks`)
        .set("Sec-Fetch-Site", "cross-site")
        .send({})

      expect(response.status).toBe(403)
    })

    it("acepta una petición del origen del frontend", async () => {
      const response = await client.request("/tasks", {
        method: "POST",
        body: {},
      })

      expect(response.status).toBe(401)
    })
  })

  describe("registro de peticiones", () => {
    it("registra método, ruta, estado y el identificador de la petición", async () => {
      const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {})

      const response = await client.request("/health", {
        headers: { "X-Request-Id": "log-test-1" },
      })

      expect(response.status).toBe(200)
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/^\[log-test-1\] GET \/v1\/health 200 \d+ms$/))
    })
  })
})
