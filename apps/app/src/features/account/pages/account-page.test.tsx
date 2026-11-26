import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"
import { renderWithProviders } from "@/test/render-with-providers"
import { server } from "@/test/server"

import { AccountPage } from "./account-page"

const user = {
  id: "1",
  name: "Ana Ruiz",
  email: "ana@mail.com",
  emailVerified: false,
  createdAt: "2026-03-15T10:00:00.000Z",
}

beforeEach(() => mockSession({ user, session: { id: "s1" } }))

describe("AccountPage", () => {
  it("muestra el nombre y el correo, y el correo no se puede editar", async () => {
    renderWithProviders(<AccountPage />)

    expect(await screen.findByLabelText("Nombre")).toHaveValue("Ana Ruiz")
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("ana@mail.com")
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("readonly")
  })

  it("muestra la verificación del correo y la fecha de alta", async () => {
    renderWithProviders(<AccountPage />)

    expect(await screen.findByText("Sin verificar")).toBeInTheDocument()
    expect(screen.getByText("15 de marzo de 2026")).toBeInTheDocument()
  })

  it("guarda el nombre nuevo", async () => {
    let body: unknown
    server.use(
      http.post("*/v1/auth/update-user", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true })
      })
    )
    renderWithProviders(<AccountPage />)

    const name = await screen.findByLabelText("Nombre")
    await userEvent.clear(name)
    await userEvent.type(name, "Luisa Gómez")
    await userEvent.click(screen.getByRole("button", { name: "Guardar nombre" }))

    expect(await screen.findByText("Nombre guardado.")).toBeInTheDocument()
    expect(body).toEqual({ name: "Luisa Gómez" })
  })

  it("valida el nombre antes de enviarlo", async () => {
    renderWithProviders(<AccountPage />)

    const name = await screen.findByLabelText("Nombre")
    await userEvent.clear(name)
    await userEvent.click(screen.getByRole("button", { name: "Guardar nombre" }))

    expect(name).toHaveAttribute("aria-invalid", "true")
  })

  it("muestra un error cuando la API rechaza el nombre", async () => {
    server.use(http.post("*/v1/auth/update-user", () => HttpResponse.json({}, { status: 500 })))
    renderWithProviders(<AccountPage />)

    await userEvent.click(await screen.findByRole("button", { name: "Guardar nombre" }))

    expect(await screen.findByText("No se pudo guardar el nombre. Inténtalo de nuevo.")).toBeInTheDocument()
  })
})
