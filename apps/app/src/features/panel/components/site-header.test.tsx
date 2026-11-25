import { render, screen } from "@testing-library/react"
import { SidebarProvider } from "@autana/ui/components/sidebar"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { stubMatchMedia } from "@/test/match-media"

import { SiteHeader } from "./site-header"

afterEach(() => vi.unstubAllGlobals())

function renderAt(path: string) {
  stubMatchMedia()
  const router = createMemoryRouter(
    [
      {
        element: (
          <SidebarProvider>
            <SiteHeader />
          </SidebarProvider>
        ),
        children: [
          { path: "/tasks", handle: { title: "Tareas" }, element: null },
          { path: "/sin-titulo", element: null },
        ],
      },
    ],
    { initialEntries: [path] }
  )
  render(<RouterProvider router={router} />)
}

describe("SiteHeader", () => {
  it("muestra el título que declara la ruta", () => {
    renderAt("/tasks")

    expect(screen.getByRole("heading", { level: 1, name: "Tareas" })).toBeInTheDocument()
  })

  it("no muestra título si la ruta no lo declara", () => {
    renderAt("/sin-titulo")

    expect(screen.getByRole("heading", { level: 1 })).toBeEmptyDOMElement()
  })
})
