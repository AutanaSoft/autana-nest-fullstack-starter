import type { TaskStatus } from "@autana/contracts/tasks"

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  done: "Hecha",
}

// Formato que espera el componente `Select` para mostrar la etiqueta del valor elegido.
export const taskStatusItems = Object.entries(taskStatusLabels).map(([value, label]) => ({ value, label }))
