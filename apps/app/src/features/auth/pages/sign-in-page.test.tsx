import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"
import { server } from "@/test/server"

import { AuthLayout } from "../layouts/auth-layout"
import { SignInPage } from "./sign-in-page"

const session = { session: { id: "s1", token: "t" }, user: { id: "u1", name: "Ana Ruiz", email: "ana@mail.com" } }

async function renderPage() {
  await mockSession(null)
  const router = createMemoryRouter(
    [
      { path: "/auth", Component: AuthLayout, children: [{ path: "sign-in", Component: SignInPage }] },
      { path: "/tasks", element: <p>Panel</p> },
    ],
    { initialEntries: ["/auth/sign-in"] }
  )
  render(<RouterProvider router={router} />)
  return { router, user: userEvent.setup() }
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Correo electrónico"), "ana@mail.com")
  await user.type(screen.getByLabelText("Contraseña", { selector: "input" }), "12345678")
  await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
}

describe("SignInPage", () => {
  it("al iniciar sesión, la sesión nueva lleva a /tasks", async () => {
    let signedIn = false
    const { router, user } = await renderPage()
    server.use(
      http.post("*/v1/auth/sign-in/email", () => {
        signedIn = true
        return HttpResponse.json({ token: "t", user: session.user })
      }),
      http.get("*/v1/auth/get-session", () => HttpResponse.json(signedIn ? session : null))
    )

    await fillAndSubmit(user)

    expect(await screen.findByText("Panel")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/tasks")
  })

  it("con credenciales incorrectas muestra el error y no navega", async () => {
    const { router, user } = await renderPage()
    server.use(
      http.post("*/v1/auth/sign-in/email", () =>
        HttpResponse.json({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }, { status: 401 })
      )
    )

    await fillAndSubmit(user)

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-in")
  })
})
