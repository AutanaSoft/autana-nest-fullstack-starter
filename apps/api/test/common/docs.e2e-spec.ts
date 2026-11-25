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
    const health = (await client.request("/health")).status
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

    it("describe las rutas de tareas y perfil, sin la ruta comodín de autenticación", () => {
      expect(Object.keys(document.paths[`${apiBasePath}/tasks`]).toSorted()).toEqual(["get", "post"])
      expect(Object.keys(document.paths[`${apiBasePath}/tasks/{taskId}`]).toSorted()).toEqual([
        "delete",
        "get",
        "patch",
      ])
      expect(Object.keys(document.paths[`${apiBasePath}/profile`]).toSorted()).toEqual(["get", "put"])
      expect(Object.keys(document.paths).some((path) => path.includes("/auth"))).toBe(false)
    })

    it("publica los esquemas del contrato y los referencia en las operaciones", () => {
      expect(Object.keys(document.components.schemas).toSorted()).toEqual([
        "CreateTask",
        "ErrorResponse",
        "HealthResponse",
        "ListTasksResponse",
        "Profile",
        "Task",
        "UpdateProfile",
        "UpdateTask",
      ])
      const create = document.paths[`${apiBasePath}/tasks`].post as {
        requestBody: { content: Record<string, { schema: unknown }> }
        responses: Record<string, { content: Record<string, { schema: unknown }> }>
      }
      expect(create.requestBody.content["application/json"].schema).toEqual({
        $ref: "#/components/schemas/CreateTask",
      })
      expect(create.responses["201"].content["application/json"].schema).toEqual({
        $ref: "#/components/schemas/Task",
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
