import { Controller, Get, ImATeapotException, Logger, UnsupportedMediaTypeException } from "@nestjs/common"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { errorResponseSchema } from "@autana/contracts/errors"
import supertest from "supertest"

import { AllowAnonymous } from "@thallesp/nestjs-better-auth"
import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

// Rutas de prueba para provocar errores que la API no produce por sí sola.
@AllowAnonymous()
@Controller("test")
class ErrorsTestController {
  @Get("boom")
  boom() {
    throw new Error("secret internal detail")
  }

  @Get("unsupported")
  unsupported() {
    throw new UnsupportedMediaTypeException()
  }

  @Get("teapot")
  teapot() {
    throw new ImATeapotException()
  }
}

describe("errores públicos", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ErrorsTestController] })
    client = createClient(app)
  })

  afterEach(() => vi.restoreAllMocks())
  afterAll(() => app.close())

  it("una ruta inexistente bajo /v1 responde 404 con el contrato", async () => {
    const response = await client.request("/no-existe")

    expect(response.status).toBe(404)
    expect(errorResponseSchema.parse(response.body)).toMatchObject({
      error: "Not Found",
      statusCode: 404,
      code: "NOT_FOUND",
    })
    expect(response.body.requestId).toBe(response.headers["x-request-id"])
  })

  it("una ruta inexistente fuera de /v1 responde 404", async () => {
    const response = await supertest(app.getHttpServer()).get("/no-existe")

    expect(response.status).toBe(404)
  })

  it("un error inesperado responde 500 sin exponer el detalle y lo registra con el requestId", async () => {
    const log = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {})

    const response = await client.request("/test/boom", {
      headers: { "X-Request-Id": "req-500" },
    })

    expect(response.status).toBe(500)
    expect(errorResponseSchema.parse(response.body)).toEqual({
      message: "Internal server error",
      error: "Internal Server Error",
      statusCode: 500,
      code: "INTERNAL_ERROR",
      requestId: "req-500",
    })
    expect(response.text).not.toContain("secret internal detail")
    expect(log).toHaveBeenCalledWith("[req-500]", expect.objectContaining({ message: "secret internal detail" }))
  })

  it("una excepción HTTP conserva su estado con el código público que le corresponde", async () => {
    const unsupported = await client.request("/test/unsupported")
    const teapot = await client.request("/test/teapot")

    expect(unsupported.status).toBe(415)
    expect(errorResponseSchema.parse(unsupported.body).code).toBe("UNSUPPORTED_MEDIA_TYPE")
    expect(teapot.status).toBe(418)
    expect(errorResponseSchema.parse(teapot.body)).toMatchObject({
      code: "HTTP_ERROR",
      statusCode: 418,
    })
  })
})
