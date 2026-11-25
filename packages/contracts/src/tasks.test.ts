import { describe, expect, it } from "vitest"

import {
  createTaskSchema,
  listTasksQuerySchema,
  taskParamsSchema,
  taskDescriptionMaxLength,
  taskPageSize,
  taskTitleMaxLength,
  updateTaskSchema,
} from "./tasks"

describe("createTaskSchema", () => {
  it("recorta el título y la descripción", () => {
    expect(createTaskSchema.parse({ title: "  Pagar la factura  ", description: "  Antes del viernes " })).toEqual({
      title: "Pagar la factura",
      description: "Antes del viernes",
    })
  })

  it("la descripción es opcional y un texto vacío equivale a no indicarla", () => {
    expect(createTaskSchema.parse({ title: "Tarea" })).toEqual({ title: "Tarea" })
    expect(createTaskSchema.parse({ title: "Tarea", description: "   " })).toEqual({
      title: "Tarea",
      description: null,
    })
    expect(createTaskSchema.parse({ title: "Tarea", description: null })).toEqual({ title: "Tarea", description: null })
  })

  it("admite una descripción del largo máximo y rechaza una más larga", () => {
    const description = (length: number) => ({ title: "Tarea", description: "a".repeat(length) })

    expect(createTaskSchema.safeParse(description(taskDescriptionMaxLength)).success).toBe(true)
    expect(createTaskSchema.safeParse(description(taskDescriptionMaxLength + 1)).success).toBe(false)
  })

  it.each(["", "   ", "a".repeat(taskTitleMaxLength + 1)])("rechaza el título %j", (title) => {
    expect(createTaskSchema.safeParse({ title }).success).toBe(false)
  })

  it("admite un título del largo máximo", () => {
    expect(createTaskSchema.safeParse({ title: "a".repeat(taskTitleMaxLength) }).success).toBe(true)
  })

  it.each(["todo", "done", "archived"])("rechaza el estado %s: una tarea siempre nace en `todo`", (status) => {
    expect(createTaskSchema.safeParse({ title: "Tarea", status }).success).toBe(false)
  })
})

describe("updateTaskSchema", () => {
  it.each([
    { title: "Nuevo" },
    { status: "done" },
    { description: "Detalle" },
    { description: null },
    { title: "Nuevo", description: "Detalle", status: "in_progress" },
  ])("acepta %j", (values) => {
    expect(updateTaskSchema.safeParse(values).success).toBe(true)
  })

  it("rechaza un cuerpo sin campos", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false)
  })
})

describe("taskParamsSchema", () => {
  it("exige un uuid", () => {
    expect(taskParamsSchema.safeParse({ taskId: "no-es-uuid" }).success).toBe(false)
    expect(taskParamsSchema.safeParse({ taskId: "3f2b8c1e-7a4d-4e9b-a6c5-1d2e8f90b7a3" }).success).toBe(true)
  })
})

describe("listTasksQuerySchema", () => {
  it("usa la primera página y el tamaño por defecto", () => {
    expect(listTasksQuerySchema.parse({})).toEqual({ page: 1, pageSize: taskPageSize.default })
  })

  it("convierte los números que llegan como texto", () => {
    expect(listTasksQuerySchema.parse({ page: "2", pageSize: "10", status: "done" })).toEqual({
      page: 2,
      pageSize: 10,
      status: "done",
    })
  })

  it.each([
    { page: "0" },
    { page: "1.5" },
    { pageSize: "0" },
    { pageSize: String(taskPageSize.max + 1) },
    { status: "x" },
  ])("rechaza %j", (query) => {
    expect(listTasksQuerySchema.safeParse(query).success).toBe(false)
  })
})
