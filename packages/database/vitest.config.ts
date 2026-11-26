import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => ({
  // `loadEnv` no escribe en `process.env`: las variables de .env llegan a las pruebas mediante `test.env`.
  test: {
    include: ["test/**/*.test.ts"],
    env: loadEnv(mode, import.meta.dirname, ""),
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      // Los esquemas los cubren las pruebas de la API, y `scripts/` es el comando interactivo.
      exclude: ["src/schema/**", "src/scripts/**"],
      reportsDirectory: "../../.coverage/database",
      reporter: ["text-summary", "html"],
      // Umbral común del proyecto (ver 09-decisiones.md).
      thresholds: { statements: 80, branches: 75, functions: 80, lines: 80 },
    },
  },
}))
