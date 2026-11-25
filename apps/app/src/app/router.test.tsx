import { render, screen } from "@testing-library/react"
import { RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"

import { router } from "./router"

// Usa el router real de la aplicación, que es único: cada prueba navega antes de renderizar.
async function renderAt(path: string) {
  await router.navigate(path)
  render(<RouterProvider router={router} />)
}

describe("router", () => {
  it("/auth redirige al inicio de sesión", async () => {
    await mockSession(null)

    await renderAt("/auth")

    expect(await screen.findByText("Inicia sesión")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-in")
  })

  it("/auth/sign-up muestra el registro", async () => {
    await mockSession(null)

    await renderAt("/auth/sign-up")

    expect(await screen.findByText("Crea tu cuenta")).toBeInTheDocument()
  })

  it.each(["/tasks", "/profile"])("%s sin sesión redirige al inicio de sesión", async (path) => {
    await mockSession(null)

    await renderAt(path)

    expect(await screen.findByText("Inicia sesión")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-in")
  })

  it("la raíz sin sesión lleva al inicio de sesión", async () => {
    await mockSession(null)

    await renderAt("/")

    expect(await screen.findByText("Inicia sesión")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-in")
  })

  it("una ruta desconocida muestra la página 404", async () => {
    await renderAt("/no-existe")

    expect(await screen.findByText("Página no encontrada")).toBeInTheDocument()
  })
})
