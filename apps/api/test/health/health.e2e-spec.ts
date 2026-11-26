import type { NestExpressApplication } from "@nestjs/platform-express"
import { healthResponseSchema } from "@autana/contracts/health"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

const emailPrefix = "health-"

describe("health", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp()
    client = createClient(app)
  })

  afterEach(() => vi.restoreAllMocks())

  afterAll(async () => {
    await client.deleteUsers(emailPrefix)
    await app.close()
  })

  // Simula una base de datos caída en la siguiente consulta del indicador.
  const failDatabase = () => vi.spyOn(client.db, "execute").mockRejectedValueOnce(new Error("connection refused"))

  describe("GET /health/live", () => {
    it("responde ok sin sesión y sin consultar la base de datos", async () => {
      const execute = vi.spyOn(client.db, "execute")

      const response = await client.request("/health/live")

      expect(response.status).toBe(200)
      expect(healthResponseSchema.parse(response.body)).toEqual({ status: "ok", info: {}, error: {}, details: {} })
      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe("GET /health/ready", () => {
    it("responde ok sin sesión cuando la base de datos está disponible", async () => {
      const response = await client.request("/health/ready")

      expect(response.status).toBe(200)
      expect(healthResponseSchema.parse(response.body)).toMatchObject({
        status: "ok",
        details: { database: { status: "up" } },
      })
    })

    it("devuelve del indicador de base de datos solo su estado y su tiempo de respuesta", async () => {
      const response = await client.request("/health/ready")

      expect(Object.keys(response.body.details.database).toSorted()).toEqual(["responseTime", "status"])
    })

    it("responde 503 con el detalle cuando la base de datos falla", async () => {
      failDatabase()

      const response = await client.request("/health/ready")

      expect(response.status).toBe(503)
      expect(healthResponseSchema.parse(response.body)).toMatchObject({
        status: "error",
        error: { database: { status: "down" } },
      })
    })
  })

  describe("GET /health", () => {
    it("responde 401 sin sesión y sin caché", async () => {
      const response = await client.request("/health")

      expect(response.status).toBe(401)
      expect(response.headers["cache-control"]).toContain("no-store")
    })

    it("devuelve el detalle de base de datos, memoria y disco con sesión", async () => {
      const { cookie } = await client.signUp(emailPrefix)

      const response = await client.request("/health", { cookie })

      expect(response.status).toBe(200)
      expect(response.headers["cache-control"]).toContain("no-store")
      const body = healthResponseSchema.parse(response.body)
      expect(Object.keys(body.details).toSorted()).toEqual(["database", "disk", "memory_heap", "memory_rss"])
    })

    it("responde 503 con el detalle cuando la base de datos falla", async () => {
      const { cookie } = await client.signUp(emailPrefix)
      failDatabase()

      const response = await client.request("/health", { cookie })

      expect(response.status).toBe(503)
      expect(healthResponseSchema.parse(response.body)).toMatchObject({
        status: "error",
        error: { database: { status: "down" } },
        info: { memory_heap: { status: "up" } },
      })
    })
  })

  describe("ciclo de la petición", () => {
    it("genera un X-Request-Id cuando el cliente no envía uno", async () => {
      const response = await client.request("/health/live")

      expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/)
    })

    it("reutiliza el X-Request-Id válido del cliente", async () => {
      const response = await client.request("/health/live", {
        headers: { "X-Request-Id": "mi-id_123" },
      })

      expect(response.headers["x-request-id"]).toBe("mi-id_123")
    })

    it("sustituye un X-Request-Id con caracteres no permitidos", async () => {
      const response = await client.request("/health/live", {
        headers: { "X-Request-Id": "¡malo!" },
      })

      expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/)
    })
  })
})
