import { render, screen } from "@testing-library/react"
import { SidebarProvider } from "@autana/ui/components/sidebar"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { stubMatchMedia } from "@/test/match-media"

import { NavMain } from "./nav-main"

afterEach(() => vi.unstubAllGlobals())

const items = [
  { title: "Estado", url: "/", icon: null },
  { title: "Cuenta", url: "/account", icon: null },
]

function renderAt(path: string) {
  stubMatchMedia()
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <SidebarProvider>
            <NavMain items={items} />
          </SidebarProvider>
        ),
      },
    ],
    { initialEntries: [path] }
  )
  render(<RouterProvider router={router} />)
}

describe("NavMain", () => {
  it("enlaza cada entrada con su ruta", () => {
    renderAt("/")

    expect(screen.getByRole("link", { name: "Estado" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Cuenta" })).toHaveAttribute("href", "/account")
  })

  it("marca como activa solo la entrada de la ruta actual, también en sus subrutas", () => {
    renderAt("/account/security")

    expect(screen.getByRole("link", { name: "Cuenta" })).toHaveAttribute("data-active")
    expect(screen.getByRole("link", { name: "Estado" })).not.toHaveAttribute("data-active")
  })
})
