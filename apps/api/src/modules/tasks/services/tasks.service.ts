import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectDrizzle } from "@nestjs/drizzle"
import {
  type CreateTaskValues,
  type ListTasksQuery,
  type ListTasksResponse,
  type Task,
  type UpdateTaskValues,
} from "@autana/contracts/tasks"
import { task } from "@autana/database/schema/task"
import { and, count, desc, eq } from "drizzle-orm"

import type { Database } from "../../../database/database.js"
import { toTask } from "../mappers/to-task.js"

// Una tarea ajena responde igual que una inexistente, para no revelar qué identificadores existen.
const taskNotFound = () => new NotFoundException({ code: "TASK_NOT_FOUND", message: "Task not found" })

@Injectable()
export class TasksService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async list(userId: string, { status, page, pageSize }: ListTasksQuery): Promise<ListTasksResponse> {
    const where = and(eq(task.userId, userId), status ? eq(task.status, status) : undefined)
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(task)
        .where(where)
        // El id desempata las tareas creadas en el mismo instante, para que la paginación sea estable.
        .orderBy(desc(task.createdAt), desc(task.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ total: count() }).from(task).where(where),
    ])

    return { items: rows.map(toTask), total, page, pageSize }
  }

  async create(userId: string, values: CreateTaskValues): Promise<Task> {
    const [created] = await this.db
      .insert(task)
      .values({ ...values, userId })
      .returning()

    return toTask(created)
  }

  async get(userId: string, taskId: string): Promise<Task> {
    const [found] = await this.db
      .select()
      .from(task)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .limit(1)
    if (!found) throw taskNotFound()

    return toTask(found)
  }

  async update(userId: string, taskId: string, values: UpdateTaskValues): Promise<Task> {
    // Una sola sentencia con el propietario en el WHERE: no hay estado previo que comprobar, así que no hay 409.
    const [updated] = await this.db
      .update(task)
      .set(values)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .returning()
    if (!updated) throw taskNotFound()

    return toTask(updated)
  }

  async delete(userId: string, taskId: string): Promise<void> {
    const [deleted] = await this.db
      .delete(task)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .returning({ id: task.id })
    if (!deleted) throw taskNotFound()
  }
}
