import { screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render-with-providers"
import { server } from "@/test/server"

import { TasksPage } from "./tasks-page"

type TaskRow = {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
}

function makeTask(n: number, overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title: `Tarea ${n}`,
    description: null,
    status: "todo",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  }
}

function mockList(items: TaskRow[], total = items.length) {
  const searches: URLSearchParams[] = []
  server.use(
    http.get("*/v1/tasks", ({ request }) => {
      searches.push(new URL(request.url).searchParams)
      return HttpResponse.json({ items, total, page: 1, pageSize: 20 })
    })
  )
  return searches
}

describe("TasksPage", () => {
  it("muestra las tareas con su estado", async () => {
    mockList([makeTask(1), makeTask(2, { status: "done" })])

    renderWithProviders(<TasksPage />)

    expect(await screen.findByText("Tarea 1")).toBeInTheDocument()
    expect(screen.getByText("Tarea 2")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Estado de Tarea 2" })).toHaveTextContent("Hecha")
  })

  it("muestra un mensaje cuando no hay tareas", async () => {
    mockList([])

    renderWithProviders(<TasksPage />)

    expect(await screen.findByText("No hay tareas que mostrar.")).toBeInTheDocument()
  })

  it("muestra un error cuando no se pueden cargar", async () => {
    server.use(http.get("*/v1/tasks", () => HttpResponse.json({}, { status: 500 })))

    renderWithProviders(<TasksPage />)

    expect(await screen.findByText("No pudimos cargar las tareas. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("lee el filtro y la página de la URL", async () => {
    const searches = mockList([])

    renderWithProviders(<TasksPage />, { route: "/?status=done&page=2" })

    await screen.findByText("No hay tareas que mostrar.")
    expect(Object.fromEntries(searches[0])).toEqual({ status: "done", page: "2" })
  })

  it("filtrar por estado actualiza la URL y vuelve a la primera página", async () => {
    const searches = mockList([makeTask(1)])
    const { router, user } = renderWithProviders(<TasksPage />, { route: "/?page=2" })
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("tab", { name: "Hecha" }))

    await waitFor(() => expect(router.state.location.search).toBe("?status=done"))
    await waitFor(() => expect(Object.fromEntries(searches.at(-1)!)).toEqual({ status: "done", page: "1" }))
  })

  it("pagina con enlaces que conservan el filtro", async () => {
    mockList([makeTask(1)], 45)
    const { router, user } = renderWithProviders(<TasksPage />, { route: "/?status=done" })
    await screen.findByText("Página 1 de 3")

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled()
    const next = screen.getByRole("link", { name: "Página siguiente" })
    expect(next).toHaveAttribute("href", "/?status=done&page=2")
    await user.click(next)

    await waitFor(() => expect(router.state.location.search).toBe("?status=done&page=2"))
    expect(await screen.findByRole("link", { name: "Página anterior" })).toHaveAttribute("href", "/?status=done")
  })

  it("crea una tarea y vuelve a cargar la lista", async () => {
    let created: unknown
    let items = [makeTask(1)]
    server.use(
      http.get("*/v1/tasks", () => HttpResponse.json({ items, total: items.length, page: 1, pageSize: 20 })),
      http.post("*/v1/tasks", async ({ request }) => {
        created = await request.json()
        items = [makeTask(2, { title: "Pagar la factura", description: "Antes del viernes" }), ...items]
        return HttpResponse.json(items[0], { status: 201 })
      })
    )
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("button", { name: "Nueva tarea" }))
    await user.type(screen.getByLabelText("Título"), "  Pagar la factura ")
    await user.type(screen.getByLabelText("Descripción"), "Antes del viernes")
    await user.click(screen.getByRole("button", { name: "Crear tarea" }))

    expect(await screen.findByText("Pagar la factura")).toBeInTheDocument()
    expect(screen.getByText("Antes del viernes")).toBeInTheDocument()
    expect(created).toEqual({ title: "Pagar la factura", description: "Antes del viernes" })
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("al crear no se puede elegir el estado ni se envía: la tarea nace en «Por hacer»", async () => {
    let created: unknown
    mockList([])
    server.use(
      http.post("*/v1/tasks", async ({ request }) => {
        created = await request.json()
        return HttpResponse.json(makeTask(1), { status: 201 })
      })
    )
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("No hay tareas que mostrar.")

    await user.click(screen.getByRole("button", { name: "Nueva tarea" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).queryByLabelText("Estado")).not.toBeInTheDocument()
    await user.type(within(dialog).getByLabelText("Título"), "Tarea")
    await user.click(within(dialog).getByRole("button", { name: "Crear tarea" }))

    await waitFor(() => expect(created).toEqual({ title: "Tarea", description: null }))
  })

  it("la descripción es opcional y admite hasta 500 caracteres", async () => {
    mockList([])
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("No hay tareas que mostrar.")

    await user.click(screen.getByRole("button", { name: "Nueva tarea" }))
    await user.type(screen.getByLabelText("Título"), "Tarea")
    await user.click(screen.getByLabelText("Descripción"))
    await user.paste("a".repeat(501))
    await user.click(screen.getByRole("button", { name: "Crear tarea" }))

    expect(await screen.findByText("La descripción no puede superar los 500 caracteres.")).toBeInTheDocument()
  })

  it("muestra la descripción de cada tarea en la lista", async () => {
    mockList([makeTask(1, { description: "Llamar al proveedor" }), makeTask(2)])

    renderWithProviders(<TasksPage />)

    expect(await screen.findByText("Llamar al proveedor")).toBeInTheDocument()
  })

  it("no envía una tarea sin título", async () => {
    mockList([])
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("No hay tareas que mostrar.")

    await user.click(screen.getByRole("button", { name: "Nueva tarea" }))
    await user.click(screen.getByRole("button", { name: "Crear tarea" }))

    expect(await screen.findByText("Escribe un título.")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("mantiene el diálogo abierto y avisa cuando la API rechaza la creación", async () => {
    mockList([])
    server.use(http.post("*/v1/tasks", () => HttpResponse.json({}, { status: 500 })))
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("No hay tareas que mostrar.")

    await user.click(screen.getByRole("button", { name: "Nueva tarea" }))
    await user.type(screen.getByLabelText("Título"), "Tarea")
    await user.click(screen.getByRole("button", { name: "Crear tarea" }))

    expect(await screen.findByText("No se pudo guardar la tarea. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("edita el título, la descripción y el estado de una tarea", async () => {
    const task = makeTask(1, { description: "Detalle anterior" })
    let body: unknown
    mockList([task])
    server.use(
      http.patch(`*/v1/tasks/${task.id}`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...task, title: "Nuevo título" })
      })
    )
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("button", { name: "Editar Tarea 1" }))
    const dialog = screen.getByRole("dialog")
    const title = within(dialog).getByLabelText("Título")
    expect(title).toHaveValue("Tarea 1")
    expect(within(dialog).getByLabelText("Descripción")).toHaveValue("Detalle anterior")
    expect(within(dialog).getByLabelText("Estado")).toHaveTextContent("Por hacer")
    await user.clear(title)
    await user.type(title, "Nuevo título")
    await user.clear(within(dialog).getByLabelText("Descripción"))
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(body).toEqual({ title: "Nuevo título", description: null, status: "todo" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("cambia el estado desde la lista", async () => {
    const task = makeTask(1)
    let body: unknown
    mockList([task])
    server.use(
      http.patch(`*/v1/tasks/${task.id}`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...task, status: "done" })
      })
    )
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("combobox", { name: "Estado de Tarea 1" }))
    await user.click(await screen.findByRole("option", { name: "Hecha" }))

    await waitFor(() => expect(body).toEqual({ status: "done" }))
  })

  it("avisa cuando falla el cambio de estado", async () => {
    const task = makeTask(1)
    mockList([task])
    server.use(http.patch(`*/v1/tasks/${task.id}`, () => HttpResponse.json({}, { status: 500 })))
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("combobox", { name: "Estado de Tarea 1" }))
    await user.click(await screen.findByRole("option", { name: "Hecha" }))

    expect(await screen.findByText("No se pudo completar la acción. Inténtalo de nuevo.")).toBeInTheDocument()
  })

  it("elimina una tarea solo después de confirmar", async () => {
    const task = makeTask(1)
    let deleted = false
    mockList([task])
    server.use(
      http.delete(`*/v1/tasks/${task.id}`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("button", { name: "Eliminar Tarea 1" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Se eliminará «Tarea 1» y no se podrá recuperar.")).toBeInTheDocument()
    expect(deleted).toBe(false)
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deleted).toBe(true))
  })

  it("cancelar el borrado no elimina la tarea", async () => {
    let deleted = false
    mockList([makeTask(1)])
    server.use(
      http.delete("*/v1/tasks/*", () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    const { user } = renderWithProviders(<TasksPage />)
    await screen.findByText("Tarea 1")

    await user.click(screen.getByRole("button", { name: "Eliminar Tarea 1" }))
    await user.click(await screen.findByRole("button", { name: "Cancelar" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(deleted).toBe(false)
  })
})
