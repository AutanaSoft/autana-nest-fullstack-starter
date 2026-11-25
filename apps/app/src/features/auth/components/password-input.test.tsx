import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"

import { PasswordInput } from "./password-input"

describe("PasswordInput", () => {
  it("empieza oculta", () => {
    render(<PasswordInput aria-label="Contraseña" />)

    expect(screen.getByLabelText("Contraseña", { selector: "input" })).toHaveAttribute("type", "password")
    expect(screen.getByRole("button", { name: "Mostrar contraseña" })).toHaveAttribute("aria-pressed", "false")
  })

  it("el botón alterna entre mostrar y ocultar sin perder el valor", async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" defaultValue="Secreto123" />)
    const input = screen.getByLabelText("Contraseña", { selector: "input" })

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }))
    expect(input).toHaveAttribute("type", "text")
    expect(input).toHaveValue("Secreto123")
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }))
    expect(input).toHaveAttribute("type", "password")
  })

  it("no envía el formulario al pulsar el botón", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Contraseña" />
      </form>
    )

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("reenvía el ref y las props al campo", () => {
    const ref = createRef<HTMLInputElement>()
    render(<PasswordInput ref={ref} aria-label="Contraseña" autoComplete="new-password" aria-invalid />)

    expect(ref.current).toBe(screen.getByLabelText("Contraseña", { selector: "input" }))
    expect(ref.current).toHaveAttribute("autocomplete", "new-password")
    expect(ref.current).toHaveAttribute("aria-invalid", "true")
  })
})
