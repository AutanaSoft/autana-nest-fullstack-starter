import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => ({
  // `loadEnv` no escribe en `process.env`: las variables de .env llegan a las pruebas mediante `test.env`.
  test: { include: ["test/**/*.test.ts"], env: loadEnv(mode, import.meta.dirname, "") },
}))
