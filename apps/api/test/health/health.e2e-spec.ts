import type { NestExpressApplication } from "@nestjs/platform-express"
import { healthResponseSchema } from "@autana/contracts/health"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

describe("health", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp()
    client = createClient(app)
  })

  afterAll(() => app.close())

  describe("GET /health", () => {
    it("responde con el contrato de salud sin sesión", async () => {
      const response = await client.request("/health")

      expect(response.status).toBe(200)
      expect(healthResponseSchema.parse(response.body)).toEqual({
        status: "ok",
      })
    })
  })

  describe("ciclo de la petición", () => {
    it("genera un X-Request-Id cuando el cliente no envía uno", async () => {
      const response = await client.request("/health")

      expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/)
    })

    it("reutiliza el X-Request-Id válido del cliente", async () => {
      const response = await client.request("/health", {
        headers: { "X-Request-Id": "mi-id_123" },
      })

      expect(response.headers["x-request-id"]).toBe("mi-id_123")
    })

    it("sustituye un X-Request-Id con caracteres no permitidos", async () => {
      const response = await client.request("/health", {
        headers: { "X-Request-Id": "¡malo!" },
      })

      expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/)
    })
  })
})
