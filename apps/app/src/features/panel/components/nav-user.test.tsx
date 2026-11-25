import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SidebarProvider } from "@autana/ui/components/sidebar"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { stubMatchMedia } from "@/test/match-media"
import { server } from "@/test/server"

import { NavUser } from "./nav-user"

afterEach(() => vi.unstubAllGlobals())

function renderNavUser(name = "Ana Ruiz") {
  stubMatchMedia()
  const router = createMemoryRouter(
    [
      {
        path: "/tasks",
        element: (
          <SidebarProvider>
            <NavUser user={{ name, email: "ana@mail.com" }} />
          </SidebarProvider>
        ),
      },
      { path: "/auth/sign-in", element: <p>Pantalla de acceso</p> },
    ],
    { initialEntries: ["/tasks"] }
  )
  render(<RouterProvider router={router} />)
  return { router, user: userEvent.setup() }
}

describe("NavUser", () => {
  it.each([
    ["Ana Ruiz", "AR"],
    ["Ana", "A"],
    ["María José Pérez Gómez", "MJ"],
  ])("muestra las iniciales de %s", (name, initials) => {
    renderNavUser(name)

    expect(screen.getByText(initials)).toBeInTheDocument()
  })

  it("muestra el nombre y el correo del usuario", () => {
    renderNavUser()

    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument()
    expect(screen.getByText("ana@mail.com")).toBeInTheDocument()
  })

  it("el menú enlaza con el perfil", async () => {
    const { user } = renderNavUser()

    await user.click(screen.getByRole("button", { name: /Ana Ruiz/ }))

    expect(await screen.findByRole("menuitem", { name: "Perfil" })).toHaveAttribute("href", "/profile")
  })

  it("cerrar sesión llama a la API y lleva a la pantalla de acceso", async () => {
    let signedOut = false
    server.use(
      http.post("*/v1/auth/sign-out", () => {
        signedOut = true
        return HttpResponse.json({ success: true })
      })
    )
    const { router, user } = renderNavUser()

    await user.click(screen.getByRole("button", { name: /Ana Ruiz/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Cerrar sesión" }))

    expect(await screen.findByText("Pantalla de acceso")).toBeInTheDocument()
    expect(signedOut).toBe(true)
    await waitFor(() => expect(router.state.location.pathname).toBe("/auth/sign-in"))
  })
})
