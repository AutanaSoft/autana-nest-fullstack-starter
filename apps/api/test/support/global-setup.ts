import { migrateDatabase } from "@autana/database/migrate"
import type { TestProject } from "vitest/node"

import { ensureDatabase } from "./ensure-database.js"

// Crea la base de pruebas si no existe y aplica las migraciones, de modo que `npm run test:e2e` no requiere pasos
// manuales. Este proceso no recibe `test.env`, así que lee la URL de la base de pruebas desde la configuración de Vitest.
export default async function setup(project: TestProject) {
  const testUrl = new URL(project.config.env.DATABASE_URL!)
  await ensureDatabase(testUrl)
  await migrateDatabase(testUrl.toString())
}
