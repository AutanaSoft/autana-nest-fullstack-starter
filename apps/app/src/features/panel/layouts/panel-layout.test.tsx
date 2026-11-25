import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { http, HttpResponse } from "msw"

import { stubMatchMedia } from "@/test/match-media"
import { mockSession } from "@/test/mock-session"
import { server } from "@/test/server"

import { PanelLayout } from "./panel-layout"

const session = { session: { id: "s1", token: "t" }, user: { id: "u1", name: "Ana Ruiz", email: "ana@mail.com" } }

afterEach(() => vi.unstubAllGlobals())

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/tasks", Component: PanelLayout, children: [{ index: true, element: <p>Contenido del panel</p> }] },
      { path: "/auth/sign-in", element: <p>Pantalla de acceso</p> },
    ],
    { initialEntries: [path] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("PanelLayout", () => {
  it("con sesión muestra el contenido y los datos del usuario", async () => {
    stubMatchMedia()
    await mockSession(session)

    const router = renderAt("/tasks")

    expect(await screen.findByText("Contenido del panel")).toBeInTheDocument()
    expect(screen.getByText("ana@mail.com")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/tasks")
  })

  it("mientras comprueba la sesión por primera vez muestra un indicador de carga", async () => {
    // El estado de carga solo existe antes de la primera respuesta: se necesita un cliente nuevo.
    vi.resetModules()
    server.use(http.get("*/v1/auth/get-session", () => new Promise(() => {})))
    const { PanelLayout: FreshPanelLayout } = await import("./panel-layout")
    const router = createMemoryRouter(
      [
        {
          path: "/tasks",
          Component: FreshPanelLayout,
          children: [{ index: true, element: <p>Contenido del panel</p> }],
        },
      ],
      { initialEntries: ["/tasks"] }
    )

    render(<RouterProvider router={router} />)

    // El indicador es el `Skeleton` de la interfaz; no tiene un rol accesible que consultar.
    expect(document.querySelector("[data-slot='skeleton']")).toBeInTheDocument()
    expect(screen.queryByText("Contenido del panel")).not.toBeInTheDocument()
  })

  it("sin sesión redirige a /auth/sign-in", async () => {
    await mockSession(null)

    const router = renderAt("/tasks")

    expect(await screen.findByText("Pantalla de acceso")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-in")
  })

  it("un error del servidor al comprobar la sesión muestra un aviso y no redirige", async () => {
    await mockSession(HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }))

    const router = renderAt("/tasks")

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos comprobar tu sesión.")
    expect(router.state.location.pathname).toBe("/tasks")
  })
})
