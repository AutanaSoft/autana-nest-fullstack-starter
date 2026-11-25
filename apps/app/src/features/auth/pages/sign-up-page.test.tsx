import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"
import { server } from "@/test/server"

import { AuthLayout } from "../layouts/auth-layout"
import { SignUpPage } from "./sign-up-page"

const session = { session: { id: "s1", token: "t" }, user: { id: "u1", name: "Ana Ruiz", email: "ana@mail.com" } }

async function renderPage() {
  await mockSession(null)
  const router = createMemoryRouter(
    [
      { path: "/auth", Component: AuthLayout, children: [{ path: "sign-up", Component: SignUpPage }] },
      { path: "/tasks", element: <p>Panel</p> },
    ],
    { initialEntries: ["/auth/sign-up"] }
  )
  render(<RouterProvider router={router} />)
  return { router, user: userEvent.setup() }
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Nombre y apellido"), "Ana Ruiz")
  await user.type(screen.getByLabelText("Correo electrónico"), "ana@mail.com")
  await user.type(screen.getByLabelText("Contraseña", { selector: "input" }), "12345678")
  await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
}

describe("SignUpPage", () => {
  it("al crear la cuenta, la sesión nueva lleva a /tasks", async () => {
    let signedUp = false
    const { router, user } = await renderPage()
    server.use(
      http.post("*/v1/auth/sign-up/email", () => {
        signedUp = true
        return HttpResponse.json({ token: "t", user: session.user })
      }),
      http.get("*/v1/auth/get-session", () => HttpResponse.json(signedUp ? session : null))
    )

    await fillAndSubmit(user)

    expect(await screen.findByText("Panel")).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/tasks")
  })

  it("con un correo ya registrado muestra el mensaje genérico y no navega", async () => {
    const { router, user } = await renderPage()
    server.use(
      http.post("*/v1/auth/sign-up/email", () =>
        HttpResponse.json({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" }, { status: 422 })
      )
    )

    await fillAndSubmit(user)

    expect(
      await screen.findByText("No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.")
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/auth/sign-up")
  })
})
