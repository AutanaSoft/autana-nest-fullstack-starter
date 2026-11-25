import { buildOpenApiConfig } from "./openapi.config.js"

describe("buildOpenApiConfig", () => {
  it("publica la documentación solo con NODE_ENV=development", () => {
    expect(buildOpenApiConfig({ NODE_ENV: "development" }).enabled).toBe(true)
    expect(buildOpenApiConfig({ NODE_ENV: "production" }).enabled).toBe(false)
    expect(buildOpenApiConfig({ NODE_ENV: "test" }).enabled).toBe(false)
    expect(buildOpenApiConfig({}).enabled).toBe(false)
  })

  it("fija la versión de la interfaz de Scalar", () => {
    expect(buildOpenApiConfig({}).referenceBundle).toMatch(/\/@scalar\/api-reference@\d+\.\d+\.\d+\/esm\.js$/)
  })

  it("cuelga las rutas del prefijo de la API", () => {
    expect(buildOpenApiConfig({})).toMatchObject({ docsPath: "/v1/docs", jsonPath: "/v1/openapi.json" })
  })
})
