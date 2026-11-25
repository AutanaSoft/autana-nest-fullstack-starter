import { buildAppConfig } from "./app.config.js"

describe("buildAppConfig", () => {
  it("aplica los valores por defecto", () => {
    expect(buildAppConfig({})).toMatchObject({
      PORT: 3000,
      WEB_ORIGIN: "http://localhost:5173",
      TRUST_PROXY: false,
    })
  })

  it("trata un PORT vacío como no definido", () => {
    expect(buildAppConfig({ PORT: "" }).PORT).toBe(3000)
  })

  it("convierte PORT y TRUST_PROXY", () => {
    expect(buildAppConfig({ PORT: "4000", TRUST_PROXY: "true" })).toMatchObject({ PORT: 4000, TRUST_PROXY: true })
  })

  it("rechaza un PORT fuera de rango", () => {
    expect(() => buildAppConfig({ PORT: "70000" })).toThrow()
  })

  it("rechaza un WEB_ORIGIN que no es una URL", () => {
    expect(() => buildAppConfig({ WEB_ORIGIN: "no-es-una-url" })).toThrow()
  })
})
