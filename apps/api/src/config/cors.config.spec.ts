import { buildCorsConfig } from "./cors.config.js"

describe("buildCorsConfig", () => {
  it("acepta el origen del frontend y envía cookies", () => {
    expect(buildCorsConfig({ WEB_ORIGIN: "https://app.example.com" })).toMatchObject({
      origin: "https://app.example.com",
      credentials: true,
    })
  })

  it("usa el origen por defecto", () => {
    expect(buildCorsConfig({}).origin).toBe("http://localhost:5173")
  })

  it("limita los métodos y expone X-Request-Id", () => {
    const config = buildCorsConfig({})
    expect(config.methods).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    expect(config.exposedHeaders).toEqual(["X-Request-Id"])
  })

  it("rechaza un origen que no es una URL", () => {
    expect(() => buildCorsConfig({ WEB_ORIGIN: "no-es-una-url" })).toThrow()
  })
})
