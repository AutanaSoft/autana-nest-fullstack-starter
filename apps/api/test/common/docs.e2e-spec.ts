import type { NestExpressApplication } from "@nestjs/platform-express"
import { apiBasePath } from "@autana/contracts/api"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

const docsPaths = ["/openapi.json", "/docs", "/auth/reference"]

async function requestStatuses(nodeEnv: string | undefined) {
  const app = await createTestApp({ env: { NODE_ENV: nodeEnv } })
  try {
    const client = createClient(app)
    const docs = await Promise.all(docsPaths.map(async (path) => (await client.request(path)).status))
    const health = (await client.request("/health/live")).status
    return { docs, health }
  } finally {
    await app.close()
  }
}

afterEach(() => vi.unstubAllEnvs())

describe("documentación de la API", () => {
  it("se publica con NODE_ENV=development, incluida la referencia de Better Auth", async () => {
    expect((await requestStatuses("development")).docs).toEqual([200, 200, 200])
  })

  it("responde 404 con NODE_ENV=production y el resto de la API sigue disponible", async () => {
    expect(await requestStatuses("production")).toEqual({
      docs: [404, 404, 404],
      health: 200,
    })
  })

  it.each(["test", undefined])("responde 404 con NODE_ENV=%s: solo se publica en desarrollo", async (nodeEnv) => {
    expect(await requestStatuses(nodeEnv)).toEqual({ docs: [404, 404, 404], health: 200 })
  })

  describe("documento OpenAPI", () => {
    let app: NestExpressApplication
    let document: {
      paths: Record<string, Record<string, unknown>>
      components: { schemas: Record<string, unknown> }
    }

    beforeAll(async () => {
      app = await createTestApp()
      document = (await createClient(app).request("/openapi.json")).body
    })

    afterAll(() => app.close())

    it("describe las rutas de salud, sin la ruta comodín de autenticación", () => {
      expect(Object.keys(document.paths).toSorted()).toEqual([
        `${apiBasePath}/health`,
        `${apiBasePath}/health/live`,
        `${apiBasePath}/health/ready`,
      ])
    })

    // Solo se publican los esquemas que alguna operación referencia.
    it("publica los esquemas del contrato", () => {
      expect(Object.keys(document.components.schemas).toSorted()).toEqual([
        "ErrorResponse",
        "HealthIndicator",
        "HealthResponse",
      ])
    })

    it("describe las rutas de salud con la respuesta 200 y la 503 del contrato", () => {
      const healthResponse = { $ref: "#/components/schemas/HealthResponse" }
      for (const path of ["/health/live", "/health/ready", "/health"]) {
        const get = document.paths[`${apiBasePath}${path}`].get as {
          responses: Record<string, { content: Record<string, { schema: unknown }> }>
        }
        expect(get.responses["200"].content["application/json"].schema).toEqual(healthResponse)
      }
      for (const path of ["/health/ready", "/health"]) {
        const get = document.paths[`${apiBasePath}${path}`].get as {
          responses: Record<string, { content: Record<string, { schema: unknown }> }>
        }
        expect(get.responses["503"].content["application/json"].schema).toEqual(healthResponse)
      }
    })

    it("documenta el 401 de la ruta de salud que exige sesión, y solo de esa", () => {
      const responses = (path: string) =>
        (
          document.paths[`${apiBasePath}${path}`].get as {
            responses: Record<string, { content?: Record<string, { schema: unknown }> }>
          }
        ).responses
      expect(responses("/health")["401"].content?.["application/json"].schema).toEqual({
        $ref: "#/components/schemas/ErrorResponse",
      })
      expect(responses("/health/live")["401"]).toBeUndefined()
      expect(responses("/health/ready")["401"]).toBeUndefined()
    })

    it("documenta el tiempo de respuesta de cada indicador", () => {
      expect(document.components.schemas.HealthIndicator).toMatchObject({
        properties: { responseTime: { type: "number" } },
      })
    })
  })

  describe("interfaz de Scalar", () => {
    it("se sirve en /docs con la versión fijada y apunta al documento OpenAPI", async () => {
      const app = await createTestApp()
      try {
        const response = await createClient(app).request("/docs")

        expect(response.type).toBe("text/html")
        expect(response.text).toMatch(/cdn\.jsdelivr\.net\/npm\/@scalar\/api-reference@\d+\.\d+\.\d+\/esm\.js/)
        expect(response.text).toContain(`${apiBasePath}/openapi.json`)
      } finally {
        await app.close()
      }
    })
  })
})
