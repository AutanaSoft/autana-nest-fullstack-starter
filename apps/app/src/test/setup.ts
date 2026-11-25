import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach } from "vitest"

import { server } from "./server"

// Se activa al cargar este archivo y no en `beforeAll`: el cliente de Better Auth captura `fetch` al importarse, y
// debe hacerlo después de que MSW lo sustituya. Una petición sin respuesta declarada hace fallar la prueba.
server.listen({ onUnhandledFrame: "error" })
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
