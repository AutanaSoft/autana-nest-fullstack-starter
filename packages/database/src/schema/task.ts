import { relations, sql } from "drizzle-orm"
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { user } from "./auth.ts"

// Los valores deben coincidir con `taskStatuses` de `@autana/contracts/tasks`: este paquete no depende de contracts.
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done"])

export const task = pgTable(
  "task",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatus("status").default("todo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  // La lista filtra por usuario y, opcionalmente, por estado.
  (table) => [index("task_user_id_status_idx").on(table.userId, table.status)]
)

export const taskRelations = relations(task, ({ one }) => ({
  user: one(user, { fields: [task.userId], references: [user.id] }),
}))
