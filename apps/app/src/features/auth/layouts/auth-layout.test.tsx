import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"

import { AuthLayout } from "./auth-layout"

const session = { session: { id: "s1", token: "t" }, user: { id: "u1", name: "Ana Ruiz", email: "ana@mail.com" } }

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: "/auth", Component: AuthLayout, children: [{ path: "sign-in", element: <p>Formulario de acceso</p> }] },
      { path: "/tasks", element: <p>Panel</p> },
    ],
    { initialEntries: [path] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("AuthLayout", () => {
  it("sin sesión muestra la página de acceso", async () => {
    await mockSession(null)

    const router = renderAt("/auth/sign-in")

    expect(await screen.findByText("Formulario de acceso")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-in")
  })

  it("con sesión redirige a /tasks", async () => {
    await mockSession(session)

    const router = renderAt("/auth/sign-in")

    expect(await screen.findByText("Panel")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/tasks")
  })
})
