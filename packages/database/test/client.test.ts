import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createDatabase } from "../src/client.ts"

describe("createDatabase", () => {
  it("conecta con la base indicada y registra el esquema", async () => {
    const { pool, db } = createDatabase(process.env.DATABASE_URL!)

    try {
      const result = await db.execute(sql`select 1 as value`)

      expect(result.rows).toEqual([{ value: 1 }])
      expect(db.query.user).toBeDefined()
    } finally {
      await pool.end()
    }
  })
})
