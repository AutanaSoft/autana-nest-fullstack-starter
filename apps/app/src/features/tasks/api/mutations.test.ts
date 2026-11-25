import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { createTask } from "./create-task"
import { deleteTask } from "./delete-task"
import { updateTask } from "./update-task"

const id = "3f2b8c1e-7a4d-4e9b-a6c5-1d2e8f90b7a3"
const task = {
  id,
  title: "Pagar la factura",
  description: "Antes del viernes",
  status: "done",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
}

describe("createTask", () => {
  it("envía los valores en el cuerpo y devuelve la tarea creada", async () => {
    let body: unknown
    server.use(
      http.post("*/v1/tasks", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(task, { status: 201 })
      })
    )

    await expect(createTask({ title: "Pagar la factura", description: "Antes del viernes" })).resolves.toMatchObject({
      id,
    })
    expect(body).toEqual({ title: "Pagar la factura", description: "Antes del viernes" })
  })
})

describe("updateTask", () => {
  it("envía solo los campos modificados a la ruta de la tarea", async () => {
    let body: unknown
    server.use(
      http.patch(`*/v1/tasks/${id}`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(task)
      })
    )

    await expect(updateTask({ taskId: id, status: "done" })).resolves.toMatchObject({ status: "done" })
    expect(body).toEqual({ status: "done" })
  })
})

describe("deleteTask", () => {
  it("elimina la tarea indicada", async () => {
    let called = false
    server.use(
      http.delete(`*/v1/tasks/${id}`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    await deleteTask(id)

    expect(called).toBe(true)
  })

  it("lanza cuando la API responde con un error", async () => {
    server.use(http.delete(`*/v1/tasks/${id}`, () => HttpResponse.json({}, { status: 404 })))

    await expect(deleteTask(id)).rejects.toThrow()
  })
})
