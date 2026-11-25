import { Client } from "pg"

import { ensureDatabase } from "../support/ensure-database.js"

// Estas pruebas crean y eliminan una base propia con un nombre que no puede coincidir con ninguna del proyecto.
describe("ensureDatabase", () => {
  const serverUrl = new URL(process.env.DATABASE_URL!)
  const name = `ensure_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`
  const urlFor = (databaseName: string) => {
    const url = new URL(serverUrl)
    url.pathname = `/${databaseName}`
    return url
  }

  async function withAdmin<T>(run: (admin: Client) => Promise<T>) {
    const admin = new Client({
      connectionString: urlFor("postgres").toString(),
    })
    await admin.connect()
    try {
      return await run(admin)
    } finally {
      await admin.end()
    }
  }

  const databaseExists = () =>
    withAdmin(async (admin) => {
      const { rowCount } = await admin.query("select 1 from pg_database where datname = $1", [name])
      return rowCount === 1
    })

  afterAll(() => withAdmin((admin) => admin.query(`drop database if exists "${name}"`)))

  it("crea la base cuando no existe", async () => {
    await ensureDatabase(urlFor(name))
    expect(await databaseExists()).toBe(true)
  })

  it("reutiliza una base que ya existe", async () => {
    await expect(ensureDatabase(urlFor(name))).resolves.toBeUndefined()
  })

  it("rechaza un nombre con caracteres no permitidos", async () => {
    await expect(ensureDatabase(urlFor('x"; drop database postgres; --'))).rejects.toThrow(/no válido/)
  })
})
