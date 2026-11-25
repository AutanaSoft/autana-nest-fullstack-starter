import { buildDatabaseConfig } from "./database.config.js"

describe("buildDatabaseConfig", () => {
  it("acepta una URL de conexión", () => {
    const DATABASE_URL = "postgres://postgres:postgres@localhost:5432/autana"
    expect(buildDatabaseConfig({ DATABASE_URL })).toEqual({ DATABASE_URL })
  })

  it("rechaza una URL inválida o ausente", () => {
    expect(() => buildDatabaseConfig({ DATABASE_URL: "no-es-una-url" })).toThrow()
    expect(() => buildDatabaseConfig({})).toThrow()
  })
})
