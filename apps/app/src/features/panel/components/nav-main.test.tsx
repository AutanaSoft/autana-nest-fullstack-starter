import { render, screen } from "@testing-library/react"
import { SidebarProvider } from "@autana/ui/components/sidebar"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { stubMatchMedia } from "@/test/match-media"

import { NavMain } from "./nav-main"

afterEach(() => vi.unstubAllGlobals())

const items = [
  { title: "Tareas", url: "/tasks", icon: null },
  { title: "Perfil", url: "/profile", icon: null },
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
    renderAt("/tasks")

    expect(screen.getByRole("link", { name: "Tareas" })).toHaveAttribute("href", "/tasks")
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("href", "/profile")
  })

  it("marca como activa solo la entrada de la ruta actual, también en sus subrutas", () => {
    renderAt("/tasks/1")

    expect(screen.getByRole("link", { name: "Tareas" })).toHaveAttribute("data-active")
    expect(screen.getByRole("link", { name: "Perfil" })).not.toHaveAttribute("data-active")
  })
})
