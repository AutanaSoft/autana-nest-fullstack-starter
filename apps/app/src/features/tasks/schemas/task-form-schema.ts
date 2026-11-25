import { z } from "zod"
import { taskDescriptionSchema, taskStatusSchema, taskTitleSchema } from "@autana/contracts/tasks"

// A diferencia de `createTaskSchema`, el formulario siempre tiene un estado: al crear no se muestra y se ignora.
export const taskFormSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  status: taskStatusSchema,
})

export type TaskFormInput = z.input<typeof taskFormSchema>
export type TaskFormValues = z.infer<typeof taskFormSchema>
