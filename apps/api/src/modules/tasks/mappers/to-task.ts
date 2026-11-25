import type { Task } from "@autana/contracts/tasks"
import type { task } from "@autana/database/schema/task"

// Adapta una fila de la base de datos al tipo del contrato: solo convierte las fechas a texto ISO.
export function toTask(row: typeof task.$inferSelect): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
