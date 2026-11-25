import { Client } from "pg"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { resetDatabase } from "../src/reset.ts"

// El reinicio destruye el esquema, así que se prueba en una base temporal propia y no en la de otras pruebas.
const adminUrl = new URL(process.env.DATABASE_URL!)
adminUrl.pathname = "/postgres"
const temporaryName = `reset_test_${crypto.randomUUID().replaceAll("-", "")}`
const temporaryUrl = new URL(adminUrl)
temporaryUrl.pathname = `/${temporaryName}`

async function withClient<T>(url: URL, run: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: url.toString() })
  await client.connect()
  try {
    return await run(client)
  } finally {
    await client.end()
  }
}

beforeAll(() => withClient(adminUrl, (admin) => admin.query(`create database "${temporaryName}"`)))
afterAll(() => withClient(adminUrl, (admin) => admin.query(`drop database if exists "${temporaryName}" with (force)`)))

describe("resetDatabase", () => {
  it("elimina los datos y las tablas ajenas, y deja las migraciones aplicadas", async () => {
    await resetDatabase(temporaryUrl.toString())
    await withClient(temporaryUrl, (client) =>
      client.query(`insert into "user" (name, email) values ('Ana Ruiz', 'ana@mail.com')`)
    )
    await withClient(temporaryUrl, (client) => client.query("create table extra (id int)"))

    await resetDatabase(temporaryUrl.toString())

    const { users, extra, migrations } = await withClient(temporaryUrl, async (client) => ({
      users: (await client.query(`select count(*)::int as count from "user"`)).rows[0].count,
      extra: (await client.query("select to_regclass('public.extra') as name")).rows[0].name,
      migrations: (await client.query("select count(*)::int as count from drizzle.__drizzle_migrations")).rows[0].count,
    }))
    expect(users).toBe(0)
    expect(extra).toBeNull()
    expect(migrations).toBeGreaterThan(0)
  })

  it("se niega con NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    await expect(resetDatabase(temporaryUrl.toString())).rejects.toThrow("NODE_ENV=production")
    vi.unstubAllEnvs()
  })

  it("rechaza un nombre de base no válido", async () => {
    await expect(resetDatabase("postgres://localhost:5432/bad-name;drop")).rejects.toThrow("no válido")
  })
})
