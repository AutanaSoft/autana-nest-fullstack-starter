import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

import { apiBasePath } from "../../packages/contracts/src/api.ts"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lee apps/app/.env para conocer el destino del proxy de desarrollo.
  const env = loadEnv(mode, import.meta.dirname, "")

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      // En desarrollo el navegador solo habla con este servidor: la cookie de sesión queda en su origen
      // y no hace falta CORS. En producción, un proxy inverso que sirva la API en el mismo origen, o `VITE_API_URL`.
      proxy: { [apiBasePath]: env.API_PROXY_TARGET || "http://localhost:3000" },
    },
  }
})
