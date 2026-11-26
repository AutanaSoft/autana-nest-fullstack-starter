import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as auth from "./schema/auth.ts"

const schema = { ...auth }

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString })
  return { pool, db: drizzle(pool, { schema }) }
}
