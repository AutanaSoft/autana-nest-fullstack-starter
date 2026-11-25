import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { fetchTasks } from "./fetch-tasks"

const task = {
  id: "3f2b8c1e-7a4d-4e9b-a6c5-1d2e8f90b7a3",
  title: "Pagar la factura",
  description: null,
  status: "todo",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
}

describe("fetchTasks", () => {
  it("devuelve la página validada contra el contrato", async () => {
    server.use(http.get("*/v1/tasks", () => HttpResponse.json({ items: [task], total: 1, page: 1, pageSize: 20 })))

    await expect(fetchTasks({}, new AbortController().signal)).resolves.toMatchObject({ total: 1, items: [task] })
  })

  it("envía el filtro y la página, y omite los indefinidos", async () => {
    let search: URLSearchParams | undefined
    server.use(
      http.get("*/v1/tasks", ({ request }) => {
        search = new URL(request.url).searchParams
        return HttpResponse.json({ items: [], total: 0, page: 2, pageSize: 20 })
      })
    )

    await fetchTasks({ status: "done", page: 2, pageSize: undefined }, new AbortController().signal)

    expect(Object.fromEntries(search!)).toEqual({ status: "done", page: "2" })
  })

  it("rechaza una respuesta que no cumple el contrato", async () => {
    server.use(http.get("*/v1/tasks", () => HttpResponse.json({ items: [{ id: 1 }] })))

    await expect(fetchTasks({}, new AbortController().signal)).rejects.toThrow()
  })
})
