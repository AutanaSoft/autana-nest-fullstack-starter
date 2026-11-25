import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { cleanStores } from "nanostores"
import type { ReactElement } from "react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach } from "vitest"

import { authClient } from "@/lib/auth-client"

// Nanostores libera el store de sesión 1 s después de desmontar el último componente. Si ese temporizador vence cuando
// jsdom ya se destruyó, Better Auth lanza `removeEventListener is not a function` y Vitest falla la ejecución. Se
// desmonta aquí, antes de liberar, y `cleanStores` ejecuta la liberación en el acto.
afterEach(() => {
  cleanup()
  cleanStores(authClient.$store.atoms.session)
})

// Renderiza `ui` en una ruta de memoria y con un cliente de consultas propio, que no reintenta: cada prueba empieza con
// la caché vacía y un error de la API se ve de inmediato.
export function renderWithProviders(ui: ReactElement, { route = "/" }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const router = createMemoryRouter([{ path: "*", element: ui }], { initialEntries: [route] })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return { router, user: userEvent.setup() }
}
