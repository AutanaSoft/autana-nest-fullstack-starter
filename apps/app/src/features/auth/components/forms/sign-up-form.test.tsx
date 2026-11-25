import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { SignUpForm } from "./sign-up-form"

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter>
      <SignUpForm onSubmit={onSubmit} />
    </MemoryRouter>
  )
  return { onSubmit, user: userEvent.setup() }
}

const nameField = () => screen.getByLabelText("Nombre y apellido")
const emailField = () => screen.getByLabelText("Correo electrónico")
const passwordField = () => screen.getByLabelText("Contraseña", { selector: "input" })
const submitButton = () => screen.getByRole("button", { name: "Crear cuenta" })

describe("SignUpForm", () => {
  it("valida nombre, correo y contraseña", async () => {
    const { onSubmit, user } = renderForm()

    await user.type(nameField(), "Ana2")
    await user.type(emailField(), "no-es-correo")
    await user.type(passwordField(), "123")
    await user.click(submitButton())

    expect(await screen.findByText("Usa solo letras, sin números ni símbolos.")).toBeInTheDocument()
    expect(screen.getByText("Escribe un correo válido.")).toBeInTheDocument()
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("pide el nombre y apellido cuando está vacío", async () => {
    const { user } = renderForm()

    await user.click(submitButton())

    expect(await screen.findByText("Escribe tu nombre y apellido.")).toBeInTheDocument()
  })

  it("envía los valores normalizados", async () => {
    const { onSubmit, user } = renderForm()

    await user.type(nameField(), "  María-José O'Brien ")
    await user.type(emailField(), " ANA@Mail.COM ")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "María-José O'Brien",
        email: "ana@mail.com",
        password: "12345678",
      })
    )
  })

  it("muestra el mensaje del error que lanza el envío", async () => {
    const { user } = renderForm(vi.fn().mockRejectedValue(new Error("No se pudo crear la cuenta.")))

    await user.type(nameField(), "Ana Ruiz")
    await user.type(emailField(), "ana@mail.com")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    expect(await screen.findByText("No se pudo crear la cuenta.")).toBeInTheDocument()
  })

  it("usa un mensaje genérico si el error no es un Error", async () => {
    const { user } = renderForm(vi.fn().mockRejectedValue("boom"))

    await user.type(nameField(), "Ana Ruiz")
    await user.type(emailField(), "ana@mail.com")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    expect(await screen.findByText("No se pudo crear la cuenta. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("deshabilita el botón mientras se envía", async () => {
    let finish!: () => void
    const { user } = renderForm(vi.fn(() => new Promise<void>((resolve) => (finish = resolve))))

    await user.type(nameField(), "Ana Ruiz")
    await user.type(emailField(), "ana@mail.com")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    await waitFor(() => expect(submitButton()).toBeDisabled())
    finish()
    await waitFor(() => expect(submitButton()).toBeEnabled())
  })

  it("enlaza con el inicio de sesión", () => {
    renderForm()

    expect(screen.getByRole("link", { name: "Inicia sesión" })).toHaveAttribute("href", "/auth/sign-in")
  })
})
