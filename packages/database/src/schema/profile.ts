import { relations } from "drizzle-orm"
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { user } from "./auth.ts"

// Datos personales opcionales del usuario. Va aparte de `user` porque `auth.ts` es el esquema que Better Auth valida.
// La clave primaria es el usuario: así hay como máximo un perfil por usuario.
export const profile = pgTable("profile", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: text("phone"),
  address: text("address"),
  addressReference: text("address_reference"),
  alternateContactName: text("alternate_contact_name"),
  alternateContactPhone: text("alternate_contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
}))
