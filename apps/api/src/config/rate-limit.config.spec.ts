import { buildRateLimitConfig } from "./rate-limit.config.js"

describe("buildRateLimitConfig", () => {
  it("limita solo en producción", () => {
    expect(buildRateLimitConfig({ NODE_ENV: "production" }).enabled).toBe(true)
    expect(buildRateLimitConfig({ NODE_ENV: "development" }).enabled).toBe(false)
    expect(buildRateLimitConfig({}).enabled).toBe(false)
  })

  it("fija una ventana de un minuto con 100 peticiones y 20 escrituras", () => {
    expect(buildRateLimitConfig({})).toMatchObject({ windowMs: 60_000, globalLimit: 100, writesLimit: 20 })
  })
})
