import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { createMemoryRouter, RouterProvider } from "react-router"

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
