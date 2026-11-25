import { existsSync } from "node:fs"
import { loadEnvFile } from "node:process"
import { defineConfig } from "drizzle-kit"

// Carga packages/database/.env, que es el directorio desde el que se ejecutan los scripts db:*. No usa
// `import.meta.dirname`, que no existe cuando Drizzle Kit carga este archivo como CommonJS. No sobrescribe las
// variables ya definidas.
if (existsSync(".env")) loadEnvFile(".env")

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
