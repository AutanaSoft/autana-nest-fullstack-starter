import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { cleanStores } from "nanostores"
import { afterAll, afterEach } from "vitest"

import { server } from "./server"

// Se activa al cargar este archivo y no en `beforeAll`: el cliente de Better Auth captura `fetch` al importarse, y
// debe hacerlo después de que MSW lo sustituya. Una petición sin respuesta declarada hace fallar la prueba.
server.listen({ onUnhandledFrame: "error" })
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(async () => {
  // Nanostores libera el store de sesión 1 s después de desmontar el último componente. Si ese temporizador vence cuando
  // jsdom ya se destruyó, Better Auth lanza `removeEventListener is not a function` y Vitest falla la ejecución.
  // `cleanStores` ejecuta la liberación al terminar cada archivo, también en los que no usan `renderWithProviders`. El
  // import es dinámico para que el cliente capture `fetch` después de `server.listen`.
  const { authClient } = await import("@/lib/auth-client")
  cleanStores(authClient.$store.atoms.session)
  server.close()
})
