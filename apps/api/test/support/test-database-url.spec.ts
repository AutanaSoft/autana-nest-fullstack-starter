import { getTestDatabaseUrl } from "./test-database-url.js"

const developmentUrl = "postgres://usuario:clave@localhost:5432/autana_dev"

describe("getTestDatabaseUrl", () => {
  it("añade el sufijo _test a la base de desarrollo", () => {
    expect(getTestDatabaseUrl(developmentUrl)).toBe("postgres://usuario:clave@localhost:5432/autana_dev_test")
  })

  it("rechaza una DATABASE_URL que ya apunta a una base de pruebas", () => {
    expect(() => getTestDatabaseUrl(developmentUrl.replace("autana_dev", "autana_dev_test"))).toThrow(
      /base de desarrollo/
    )
  })
})
