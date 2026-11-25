import { resolve } from "node:path"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

// Aplica las migraciones pendientes a la base indicada.
export async function migrateDatabase(connectionString: string) {
  const pool = new Pool({ connectionString })
  try {
    await migrate(drizzle(pool), { migrationsFolder: resolve(import.meta.dirname, "../migrations") })
  } finally {
    await pool.end()
  }
}
