import { Injectable } from "@nestjs/common"
import { BeforeCreate, BeforeUpdate, DatabaseHook } from "@thallesp/nestjs-better-auth"
import { APIError } from "better-auth/api"
import { emailSchema, nameSchema } from "@autana/contracts/auth"

type UserFields = { name?: string; email?: string }

// Valida con las reglas del contrato el nombre y el correo que lleguen y devuelve los valores normalizados (nombre
// recortado, correo en minúsculas). Se aplica al crear y al modificar un usuario, para cubrir todos los endpoints que lo
// hagan. Los mensajes son fijos: el detalle de la validación no se expone.
@DatabaseHook()
@Injectable()
export class UserValidationHook {
  @BeforeCreate("user")
  beforeCreate(user: UserFields) {
    return { data: this.validate(user) }
  }

  @BeforeUpdate("user")
  beforeUpdate(user: UserFields) {
    return { data: this.validate(user) }
  }

  private validate<T extends UserFields>(data: T): T {
    const validated = { ...data }
    if (data.name !== undefined) {
      const name = nameSchema.safeParse(data.name)
      if (!name.success) throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Invalid name" })
      validated.name = name.data
    }
    if (data.email !== undefined) {
      const email = emailSchema.safeParse(data.email)
      if (!email.success) throw new APIError("BAD_REQUEST", { code: "INVALID_EMAIL", message: "Invalid email" })
      validated.email = email.data
    }
    return validated
  }
}
