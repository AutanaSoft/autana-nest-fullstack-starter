import { createAuthClient } from "better-auth/react"
import { apiBasePath } from "@autana/contracts/api"

// Sin `VITE_API_URL` usa el origen actual, que en desarrollo reenvía la API el proxy de Vite. Con la API en otro
// origen del mismo sitio (por ejemplo `https://api.example.com`), el cliente de Better Auth ya envía las cookies en
// las peticiones entre orígenes (`credentials: "include"`).
const apiUrl = import.meta.env.VITE_API_URL

export const authClient = createAuthClient({
  basePath: `${apiBasePath}/auth`,
  baseURL: apiUrl || undefined,
})
