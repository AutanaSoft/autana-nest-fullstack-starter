import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { stubMatchMedia } from "@/test/match-media"

import { ThemeProvider, useTheme } from "./theme-provider"

function ThemeProbe() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <p data-testid="theme">{theme}</p>
      <button onClick={() => setTheme("dark")}>Oscuro</button>
      <input aria-label="Campo" />
    </>
  )
}

function renderProvider(props: Partial<React.ComponentProps<typeof ThemeProvider>> = {}) {
  return render(
    <ThemeProvider disableTransitionOnChange={false} {...props}>
      <ThemeProbe />
    </ThemeProvider>
  )
}

const rootClasses = () => document.documentElement.classList

beforeEach(() => {
  localStorage.clear()
  rootClasses().remove("light", "dark")
})

afterEach(() => vi.unstubAllGlobals())

describe("ThemeProvider", () => {
  it("con el tema del sistema aplica la clase según la preferencia del sistema", () => {
    stubMatchMedia(true)

    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("system")
    expect(rootClasses().contains("dark")).toBe(true)
  })

  it("el tema guardado prevalece sobre el predeterminado", () => {
    stubMatchMedia(false)
    localStorage.setItem("theme", "dark")

    renderProvider()

    expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    expect(rootClasses().contains("dark")).toBe(true)
  })

  it("ignora un valor guardado que no es un tema", () => {
    stubMatchMedia(false)
    localStorage.setItem("theme", "azul")

    renderProvider({ defaultTheme: "light" })

    expect(screen.getByTestId("theme")).toHaveTextContent("light")
  })

  it("cambiar el tema lo guarda y actualiza la clase", async () => {
    stubMatchMedia(false)
    renderProvider()

    await userEvent.click(screen.getByRole("button", { name: "Oscuro" }))

    expect(localStorage.getItem("theme")).toBe("dark")
    expect(rootClasses().contains("dark")).toBe(true)
    expect(rootClasses().contains("light")).toBe(false)
  })

  it("con el tema del sistema reacciona a un cambio de preferencia", () => {
    const media = stubMatchMedia(false)
    renderProvider()
    expect(rootClasses().contains("light")).toBe(true)

    act(() => media.setMatches(true))

    expect(rootClasses().contains("dark")).toBe(true)
  })

  describe("atajo de teclado", () => {
    it("la tecla d alterna entre claro y oscuro y lo guarda", () => {
      stubMatchMedia(false)
      renderProvider({ defaultTheme: "light" })

      fireEvent.keyDown(window, { key: "d" })
      expect(screen.getByTestId("theme")).toHaveTextContent("dark")
      expect(localStorage.getItem("theme")).toBe("dark")

      fireEvent.keyDown(window, { key: "D" })
      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })

    it("desde el tema del sistema pasa al contrario del que está activo", () => {
      stubMatchMedia(true)
      renderProvider()

      fireEvent.keyDown(window, { key: "d" })

      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })

    it("no actúa al escribir en un campo ni con teclas modificadoras", () => {
      stubMatchMedia(false)
      renderProvider({ defaultTheme: "light" })

      fireEvent.keyDown(screen.getByLabelText("Campo"), { key: "d" })
      fireEvent.keyDown(window, { key: "d", ctrlKey: true })

      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })
  })

  describe("sincronización entre pestañas", () => {
    const storageEvent = (init: StorageEventInit) =>
      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { storageArea: localStorage, ...init }))
      })

    it("adopta el tema que otra pestaña guarda", () => {
      stubMatchMedia(false)
      renderProvider({ defaultTheme: "light" })

      storageEvent({ key: "theme", newValue: "dark" })

      expect(screen.getByTestId("theme")).toHaveTextContent("dark")
    })

    it("vuelve al tema predeterminado si el valor guardado no es válido", () => {
      stubMatchMedia(false)
      localStorage.setItem("theme", "dark")
      renderProvider({ defaultTheme: "light" })

      storageEvent({ key: "theme", newValue: null })

      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })

    it("ignora los cambios de otras claves", () => {
      stubMatchMedia(false)
      renderProvider({ defaultTheme: "light" })

      storageEvent({ key: "otra", newValue: "dark" })

      expect(screen.getByTestId("theme")).toHaveTextContent("light")
    })
  })

  it("useTheme falla fuera de un ThemeProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<ThemeProbe />)).toThrow("useTheme must be used within a ThemeProvider")
    vi.restoreAllMocks()
  })
})
