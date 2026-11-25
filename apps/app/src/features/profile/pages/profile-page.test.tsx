import { screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"
import { renderWithProviders } from "@/test/render-with-providers"
import { server } from "@/test/server"

import { ProfilePage } from "./profile-page"

const emptyProfile = {
  phone: null,
  address: null,
  addressReference: null,
  alternateContactName: null,
  alternateContactPhone: null,
}

beforeEach(() => mockSession({ user: { id: "1", name: "Ana Ruiz", email: "ana@mail.com" }, session: { id: "s1" } }))

describe("ProfilePage", () => {
  it("muestra el nombre y el correo de la cuenta, y el correo no se puede editar", async () => {
    server.use(http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)))

    renderWithProviders(<ProfilePage />)

    expect(await screen.findByLabelText("Nombre")).toHaveValue("Ana Ruiz")
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("ana@mail.com")
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("readonly")
  })

  it("muestra los datos de contacto guardados", async () => {
    server.use(
      http.get("*/v1/profile", () =>
        HttpResponse.json({ ...emptyProfile, phone: "+593991234567", address: "Av. Principal 123" })
      )
    )

    renderWithProviders(<ProfilePage />)

    expect(await screen.findByLabelText("Teléfono")).toHaveValue("+593991234567")
    expect(screen.getByLabelText("Dirección")).toHaveValue("Av. Principal 123")
    expect(screen.getByLabelText("Referencia de la dirección")).toHaveValue("")
  })

  it("muestra un error cuando no se puede cargar el perfil", async () => {
    server.use(http.get("*/v1/profile", () => HttpResponse.json({}, { status: 500 })))

    renderWithProviders(<ProfilePage />)

    expect(await screen.findByText("No pudimos cargar tu perfil. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("guarda el perfil con los textos vacíos como null", async () => {
    let body: unknown
    server.use(
      http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)),
      http.put("*/v1/profile", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(emptyProfile)
      })
    )
    const { user } = renderWithProviders(<ProfilePage />)

    await user.type(await screen.findByLabelText("Teléfono"), " +593 99 123 4567 ")
    await user.type(screen.getByLabelText("Referencia de la dirección"), "Frente al parque")
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }))

    expect(await screen.findByText("Perfil guardado.")).toBeInTheDocument()
    expect(body).toEqual({
      ...emptyProfile,
      phone: "+593 99 123 4567",
      addressReference: "Frente al parque",
    })
  })

  it("no envía un teléfono inválido", async () => {
    let saved = false
    server.use(
      http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)),
      http.put("*/v1/profile", () => {
        saved = true
        return HttpResponse.json(emptyProfile)
      })
    )
    const { user } = renderWithProviders(<ProfilePage />)

    await user.type(await screen.findByLabelText("Teléfono"), "123")
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }))

    expect(await screen.findByText("Escribe un teléfono válido, con entre 7 y 15 dígitos.")).toBeInTheDocument()
    expect(saved).toBe(false)
  })

  it("avisa cuando la API rechaza el perfil", async () => {
    server.use(
      http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)),
      http.put("*/v1/profile", () => HttpResponse.json({}, { status: 500 }))
    )
    const { user } = renderWithProviders(<ProfilePage />)

    await user.click(await screen.findByRole("button", { name: "Guardar perfil" }))

    expect(await screen.findByText("No se pudo guardar el perfil. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("guarda el nombre de la cuenta", async () => {
    let body: unknown
    server.use(
      http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)),
      http.post("*/v1/auth/update-user", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true })
      })
    )
    const { user } = renderWithProviders(<ProfilePage />)

    const name = await screen.findByLabelText("Nombre")
    await user.clear(name)
    await user.type(name, "Luisa Gómez")
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }))

    expect(await screen.findByText("Nombre guardado.")).toBeInTheDocument()
    expect(body).toEqual({ name: "Luisa Gómez" })
  })

  it("no envía un nombre inválido", async () => {
    server.use(http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)))
    const { user } = renderWithProviders(<ProfilePage />)

    const name = await screen.findByLabelText("Nombre")
    await user.clear(name)
    await user.type(name, "Ana2")
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }))

    expect(await screen.findByText("Usa solo letras, sin números ni símbolos.")).toBeInTheDocument()
  })

  it("avisa cuando Better Auth rechaza el nombre", async () => {
    server.use(
      http.get("*/v1/profile", () => HttpResponse.json(emptyProfile)),
      http.post("*/v1/auth/update-user", () =>
        HttpResponse.json({ code: "INVALID_NAME", message: "Invalid name" }, { status: 400 })
      )
    )
    const { user } = renderWithProviders(<ProfilePage />)

    await user.click(await screen.findByRole("button", { name: "Guardar nombre" }))

    await waitFor(() =>
      expect(screen.getByText("No se pudo guardar el nombre. Inténtalo de nuevo.")).toBeInTheDocument()
    )
  })
})
