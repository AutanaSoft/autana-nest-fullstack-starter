import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { SignInForm } from "./sign-in-form"

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter>
      <SignInForm onSubmit={onSubmit} />
    </MemoryRouter>
  )
  return { onSubmit, user: userEvent.setup() }
}

const emailField = () => screen.getByLabelText("Correo electrónico")
const passwordField = () => screen.getByLabelText("Contraseña", { selector: "input" })
const submitButton = () => screen.getByRole("button", { name: "Iniciar sesión" })

describe("SignInForm", () => {
  it("muestra los errores de un formulario vacío y no envía", async () => {
    const { onSubmit, user } = renderForm()

    await user.click(submitButton())

    expect(await screen.findByText("Escribe un correo válido.")).toBeInTheDocument()
    expect(screen.getByText("Escribe tu contraseña.")).toBeInTheDocument()
    expect(emailField()).toHaveAttribute("aria-invalid", "true")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("asocia cada error con su campo", async () => {
    const { user } = renderForm()

    await user.click(submitButton())

    const error = await screen.findByText("Escribe un correo válido.")
    expect(emailField().getAttribute("aria-describedby")).toBe(error.id)
  })

  it("envía el correo normalizado y la contraseña sin recortar", async () => {
    const { onSubmit, user } = renderForm()

    await user.type(emailField(), "  ANA@Mail.COM ")
    await user.type(passwordField(), " secreto ")
    await user.click(submitButton())

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "ana@mail.com", password: " secreto " }))
  })

  it("muestra el mensaje del error que lanza el envío", async () => {
    const { user } = renderForm(vi.fn().mockRejectedValue(new Error("Correo o contraseña incorrectos.")))

    await user.type(emailField(), "ana@mail.com")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument()
  })

  it("usa un mensaje genérico si el error no es un Error", async () => {
    const { user } = renderForm(vi.fn().mockRejectedValue("boom"))

    await user.type(emailField(), "ana@mail.com")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    expect(await screen.findByText("No se pudo iniciar sesión. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("deshabilita el botón mientras se envía", async () => {
    let finish!: () => void
    const { user } = renderForm(vi.fn(() => new Promise<void>((resolve) => (finish = resolve))))

    await user.type(emailField(), "ana@mail.com")
    await user.type(passwordField(), "12345678")
    await user.click(submitButton())

    await waitFor(() => expect(submitButton()).toBeDisabled())
    finish()
    await waitFor(() => expect(submitButton()).toBeEnabled())
  })

  it("enlaza con el registro", () => {
    renderForm()

    expect(screen.getByRole("link", { name: "Regístrate" })).toHaveAttribute("href", "/auth/sign-up")
  })
})
