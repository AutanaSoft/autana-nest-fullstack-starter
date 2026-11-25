import { createDatabase } from "@autana/database/client"
import { getAuthTables } from "better-auth/db"
import { admin } from "better-auth/plugins"
import { sql } from "drizzle-orm"

// Compara las tablas que Better Auth necesita con las de la base migrada: columnas, tipos, nulabilidad
// y claves foráneas. Los ids son uuid y las fechas son timestamptz.
const expectedTypes: Record<string, string> = {
  string: "text",
  boolean: "boolean",
  date: "timestamp with time zone",
  number: "integer",
}

const toSnakeCase = (value: string) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

type ColumnRow = {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
}
type ForeignKeyRow = {
  table_name: string
  column_name: string
  referenced: string
  on_delete: string
}

describe("esquema de la base de datos", () => {
  const { pool, db } = createDatabase(process.env.DATABASE_URL!)
  let columns: ColumnRow[]
  let foreignKeys: ForeignKeyRow[]

  beforeAll(async () => {
    columns = (
      await db.execute<ColumnRow>(
        sql`select table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public'`
      )
    ).rows
    foreignKeys = (
      await db.execute<ForeignKeyRow>(sql`
        select c.conrelid::regclass::text as table_name, a.attname as column_name,
               regexp_replace(c.confrelid::regclass::text, '"', '', 'g') as referenced,
               case c.confdeltype when 'c' then 'cascade' when 'a' then 'no action' else c.confdeltype::text end as on_delete
        from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
        where c.contype = 'f'`)
    ).rows
  })

  afterAll(() => pool.end())

  const tables = getAuthTables({ emailAndPassword: { enabled: true }, plugins: [admin()] })

  for (const table of Object.values(tables)) {
    describe(table.modelName, () => {
      it("tiene el id como uuid generado por PostgreSQL", () => {
        const id = columns.find((column) => column.table_name === table.modelName && column.column_name === "id")

        expect(id?.data_type).toBe("uuid")
      })

      it("tiene exactamente las columnas de Better Auth, con su tipo y nulabilidad", () => {
        const expected = Object.entries(table.fields).map(([name, field]) => ({
          column: toSnakeCase(field.fieldName ?? name),
          type: field.references ? "uuid" : expectedTypes[field.type as string],
          nullable: field.required === false ? "YES" : "NO",
        }))
        const actual = columns
          .filter((column) => column.table_name === table.modelName && column.column_name !== "id")
          .map((column) => ({
            column: column.column_name,
            type: column.data_type,
            nullable: column.is_nullable,
          }))

        expect(actual).toEqual(expect.arrayContaining(expected))
        expect(actual).toHaveLength(expected.length)
      })

      it("tiene las claves foráneas con el borrado en cascada", () => {
        const expected = Object.entries(table.fields)
          .filter(([, field]) => field.references)
          .map(([name, field]) => ({
            column: toSnakeCase(field.fieldName ?? name),
            referenced: field.references!.model,
            onDelete: "cascade",
          }))
        const actual = foreignKeys
          .filter((key) => key.table_name.replaceAll('"', "") === table.modelName)
          .map((key) => ({
            column: key.column_name,
            referenced: key.referenced,
            onDelete: key.on_delete,
          }))

        expect(actual).toEqual(expected)
      })
    })
  }
})
