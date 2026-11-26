import { screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render-with-providers"
import { server } from "@/test/server"

import { StatusPage } from "./status-page"

describe("StatusPage", () => {
  it("muestra el estado global y el de cada indicador", async () => {
    server.use(
      http.get("*/v1/health", () =>
        HttpResponse.json({
          status: "ok",
          info: {},
          error: {},
          details: {
            database: { status: "up", responseTime: 3 },
            memory_heap: { status: "up" },
            memory_rss: { status: "up" },
            disk: { status: "up" },
          },
        })
      )
    )

    renderWithProviders(<StatusPage />)

    expect(await screen.findByText("Operativa")).toBeInTheDocument()
    const database = screen.getByRole("group", { name: "Base de datos" })
    expect(within(database).getByText("Disponible")).toBeInTheDocument()
    expect(within(database).getByText("Respuesta en 3 ms")).toBeInTheDocument()
    for (const name of ["Memoria (heap)", "Memoria (RSS)", "Disco"]) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument()
    }
  })

  it("muestra el indicador caído y su mensaje cuando la API responde 503", async () => {
    server.use(
      http.get("*/v1/health", () =>
        HttpResponse.json(
          {
            status: "error",
            info: {},
            error: { database: { status: "down", message: "connection refused" } },
            details: { database: { status: "down", message: "connection refused" } },
          },
          { status: 503 }
        )
      )
    )

    renderWithProviders(<StatusPage />)

    expect(await screen.findByText("Con fallos")).toBeInTheDocument()
    const database = screen.getByRole("group", { name: "Base de datos" })
    expect(within(database).getByText("Caído")).toBeInTheDocument()
    expect(within(database).getByText("connection refused")).toBeInTheDocument()
  })

  it("muestra un error cuando no se puede consultar la API", async () => {
    server.use(http.get("*/v1/health", () => HttpResponse.error()))

    renderWithProviders(<StatusPage />)

    expect(await screen.findByText("No pudimos consultar el estado de la API. Inténtalo de nuevo.")).toBeInTheDocument()
  })
})
