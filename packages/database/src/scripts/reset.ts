import { existsSync } from "node:fs"
import { loadEnvFile } from "node:process"
import { createInterface } from "node:readline/promises"

import { getResettableDatabaseName, resetDatabase } from "../reset.ts"

// Carga packages/database/.env, que es el directorio desde el que se ejecutan los scripts db:*. No sobrescribe las
// variables ya definidas.
if (existsSync(".env")) loadEnvFile(".env")

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL no está definida")

const name = getResettableDatabaseName(connectionString)
const { host } = new URL(connectionString)

console.log(`
Reinicio de la base de datos
  Base:     ${name}
  Host:     ${host}
  Entorno:  ${process.env.NODE_ENV ?? "no definido"}

Se eliminarán todas las tablas y datos, y se volverán a aplicar las migraciones.
`)

// Se leen las líneas con un iterador, que también funciona cuando la entrada llega por una tubería.
const lines = createInterface({ input: process.stdin })[Symbol.asyncIterator]()
async function ask(question: string) {
  process.stdout.write(question)
  return ((await lines.next()).value ?? "").trim()
}

function cancel(message: string): never {
  console.log(message)
  process.exit(1)
}

if ((await ask("Escribe el nombre de la base para continuar: ")) !== name) cancel("Cancelado: el nombre no coincide.")
if ((await ask(`¿Reiniciar la base "${name}" en ${host}? (yes/no): `)) !== "yes") cancel("Cancelado.")

await resetDatabase(connectionString)
console.log(`\nBase "${name}" reiniciada y migrada.`)
process.exit(0)
