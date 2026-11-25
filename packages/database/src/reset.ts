import { Client } from "pg"

import { migrateDatabase } from "./migrate.ts"

// Devuelve el nombre de la base de la URL y comprueba que reiniciarla es seguro.
export function getResettableDatabaseName(connectionString: string) {
  if (process.env.NODE_ENV === "production") throw new Error("No se puede reiniciar la base con NODE_ENV=production")

  const name = new URL(connectionString).pathname.slice(1)
  if (!/^\w+$/.test(name)) throw new Error(`Nombre de base de datos no válido: ${name}`)
  return name
}

// Deja la base como recién creada: elimina todas las tablas y el registro de migraciones, y vuelve a migrar.
// El borrado es una sola transacción, así que un fallo no lo deja a medias.
// `drop schema public cascade` también elimina las extensiones instaladas en `public`; hoy no hay ninguna
// (`gen_random_uuid()` es nativa de PostgreSQL), pero habría que recrearlas aquí si se añade alguna.
export async function resetDatabase(connectionString: string) {
  getResettableDatabaseName(connectionString)

  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query("begin")
    await client.query("drop schema if exists public cascade")
    await client.query("drop schema if exists drizzle cascade")
    await client.query("create schema public")
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    await client.end()
  }

  await migrateDatabase(connectionString)
}
