import { buildAuthConfig } from "./auth.config.js"

const valid = {
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
}

describe("buildAuthConfig", () => {
  it("acepta una configuración válida", () => {
    expect(buildAuthConfig(valid)).toEqual({ ...valid, WEB_ORIGIN: "http://localhost:5173" })
  })

  it("rechaza un secreto corto", () => {
    expect(() => buildAuthConfig({ ...valid, BETTER_AUTH_SECRET: "corto" })).toThrow()
  })

  it("rechaza una URL de Better Auth con ruta", () => {
    expect(() => buildAuthConfig({ ...valid, BETTER_AUTH_URL: "http://localhost:3000/api" })).toThrow()
  })

  it("normaliza CLIENT_IP_HEADER y trata el valor vacío como no definido", () => {
    expect(buildAuthConfig({ ...valid, CLIENT_IP_HEADER: "CF-Connecting-IP" }).CLIENT_IP_HEADER).toBe(
      "cf-connecting-ip"
    )
    expect(buildAuthConfig({ ...valid, CLIENT_IP_HEADER: "" }).CLIENT_IP_HEADER).toBeUndefined()
    expect(() => buildAuthConfig({ ...valid, CLIENT_IP_HEADER: "no válida" })).toThrow()
  })
})
