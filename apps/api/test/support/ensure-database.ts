import { Client } from "pg"

// Crea la base si no existe. El nombre se interpola en la sentencia, así que solo admite caracteres de palabra.
export async function ensureDatabase(url: URL) {
  const name = url.pathname.slice(1)
  if (!/^\w+$/.test(name)) throw new Error(`Nombre de base de datos no válido: ${name}`)

  const adminUrl = new URL(url)
  adminUrl.pathname = "/postgres"
  const admin = new Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  try {
    const { rowCount } = await admin.query("select 1 from pg_database where datname = $1", [name])
    if (!rowCount) await admin.query(`create database "${name}"`)
  } finally {
    await admin.end()
  }
}
