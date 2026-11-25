import { z } from "zod"

// Los valores deben coincidir con `taskStatus` de `@autana/database/schema/task`: este paquete no depende de database.
export const taskStatuses = ["todo", "in_progress", "done"] as const

export const taskTitleMaxLength = 120
export const taskDescriptionMaxLength = 500

// Tamaño de página de la lista: el máximo evita que una petición pida toda la tabla de golpe.
export const taskPageSize = { default: 20, max: 100 } as const

export const taskStatusSchema = z.enum(taskStatuses).meta({ example: "todo" })

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Escribe un título.")
  .max(taskTitleMaxLength, `El título no puede superar los ${taskTitleMaxLength} caracteres.`)

// Recorta el texto y lo normaliza a `null` cuando queda vacío, para que la base no guarde cadenas vacías.
export const taskDescriptionSchema = z
  .string()
  .trim()
  .max(taskDescriptionMaxLength, `La descripción no puede superar los ${taskDescriptionMaxLength} caracteres.`)
  .nullable()
  .transform((value) => value || null)

export const taskSchema = z.object({
  id: z.uuid(),
  title: taskTitleSchema,
  description: z.string().nullable(),
  status: taskStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

// Una tarea siempre nace en `todo`: el estado no se puede indicar al crearla, y enviarlo es un error.
export const createTaskSchema = z.strictObject({
  title: taskTitleSchema,
  description: taskDescriptionSchema.optional(),
})

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.optional(),
    status: taskStatusSchema.optional(),
  })
  .refine((values) => Object.keys(values).length > 0, "Indica al menos un campo para modificar.")

export const taskParamsSchema = z.object({
  taskId: z.uuid().meta({ example: "3f2b8c1e-7a4d-4e9b-a6c5-1d2e8f90b7a3" }),
})

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(taskPageSize.max).default(taskPageSize.default),
})

export const listTasksResponseSchema = z.object({
  items: z.array(taskSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})

export type TaskStatus = z.infer<typeof taskStatusSchema>
export type Task = z.infer<typeof taskSchema>
export type CreateTaskValues = z.input<typeof createTaskSchema>
export type UpdateTaskValues = z.infer<typeof updateTaskSchema>
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>
export type ListTasksResponse = z.infer<typeof listTasksResponseSchema>
