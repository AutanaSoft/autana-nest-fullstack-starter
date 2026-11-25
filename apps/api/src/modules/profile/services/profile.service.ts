import { Injectable } from "@nestjs/common"
import { InjectDrizzle } from "@nestjs/drizzle"
import type { Profile, UpdateProfileValues } from "@autana/contracts/profile"
import { profile } from "@autana/database/schema/profile"
import { eq } from "drizzle-orm"

import type { Database } from "../../../database/database.js"

@Injectable()
export class ProfileService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async get(userId: string): Promise<Profile> {
    const [found] = await this.db.select().from(profile).where(eq(profile.userId, userId)).limit(1)

    // Un perfil sin guardar no es un error: se devuelve vacío, sin crear la fila.
    return (
      found ?? {
        phone: null,
        address: null,
        addressReference: null,
        alternateContactName: null,
        alternateContactPhone: null,
      }
    )
  }

  async save(userId: string, values: UpdateProfileValues): Promise<Profile> {
    // Alta o actualización en una sola sentencia. `$onUpdate` no actúa en `onConflictDoUpdate`, así que `updatedAt`
    // se indica aquí.
    const [saved] = await this.db
      .insert(profile)
      .values({ ...values, userId })
      .onConflictDoUpdate({
        target: profile.userId,
        set: { ...values, updatedAt: new Date() },
      })
      .returning()

    return saved
  }
}
