import { taskStatuses } from "@autana/contracts/tasks"
import { createDatabase } from "@autana/database/client"
import { user } from "@autana/database/schema/auth"
import { profile } from "@autana/database/schema/profile"
import { task, taskStatus } from "@autana/database/schema/task"
import { eq, like, sql } from "drizzle-orm"

const emailPrefix = "e2e-schema-"

describe("esquema de las tablas de la aplicación", () => {
  const { pool, db } = createDatabase(process.env.DATABASE_URL!)

  async function createUser() {
    const [created] = await db
      .insert(user)
      .values({
        name: "Ana Ruiz",
        email: `${emailPrefix}${crypto.randomUUID()}@mail.com`,
      })
      .returning({ id: user.id })
    return created.id
  }

  // Cada prueba crea sus propios usuarios y los elimina al terminar, con sus tareas y perfil por cascada.
  afterEach(() => db.delete(user).where(like(user.email, `${emailPrefix}%`)))
  afterAll(() => pool.end())

  it("los estados de la tarea coinciden con los del contrato", () => {
    expect(taskStatus.enumValues).toEqual([...taskStatuses])
  })

  it("las fechas son timestamptz y los ids de la tarea, uuid", async () => {
    const { rows } = await db.execute<{
      table_name: string
      column_name: string
      data_type: string
    }>(
      sql`select table_name, column_name, data_type from information_schema.columns
          where table_schema = 'public' and table_name in ('task', 'profile')`
    )
    const typeOf = (table: string, column: string) =>
      rows.find((row) => row.table_name === table && row.column_name === column)?.data_type

    expect(typeOf("task", "id")).toBe("uuid")
    expect(typeOf("task", "user_id")).toBe("uuid")
    expect(typeOf("profile", "user_id")).toBe("uuid")
    for (const table of ["task", "profile"]) {
      expect(typeOf(table, "created_at")).toBe("timestamp with time zone")
      expect(typeOf(table, "updated_at")).toBe("timestamp with time zone")
    }
  })

  it("la tarea nace en estado `todo`", async () => {
    const userId = await createUser()

    const [created] = await db.insert(task).values({ userId, title: "Tarea" }).returning()

    expect(created.status).toBe("todo")
  })

  it("rechaza un estado que no existe", async () => {
    const userId = await createUser()

    await expect(
      db.execute(sql`insert into task (user_id, title, status) values (${userId}, 'Tarea', 'archived')`)
    ).rejects.toThrow()
  })

  it("solo permite un perfil por usuario", async () => {
    const userId = await createUser()
    await db.insert(profile).values({ userId })

    await expect(db.insert(profile).values({ userId })).rejects.toThrow()
  })

  it("elimina las tareas y el perfil al eliminar el usuario", async () => {
    const userId = await createUser()
    await db.insert(task).values({ userId, title: "Tarea" })
    await db.insert(profile).values({ userId, phone: "+593991234567" })

    await db.delete(user).where(eq(user.id, userId))

    expect(await db.select().from(task).where(eq(task.userId, userId))).toHaveLength(0)
    expect(await db.select().from(profile).where(eq(profile.userId, userId))).toHaveLength(0)
  })
})
