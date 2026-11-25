import { APIError } from "better-auth/api"
import { emailSchema, nameSchema } from "@autana/contracts/auth"

// Valida con las reglas del contrato los campos del usuario que lleguen y devuelve los valores normalizados
// (nombre recortado, correo en minúsculas). Se aplica al crear y al modificar un usuario, para cubrir todos los
// endpoints que lo hagan. Los mensajes son fijos: el detalle de la validación no se expone.
export function validateUserFields<T extends { name?: string; email?: string }>(data: T): T {
  const validated = { ...data }
  if (data.name !== undefined) {
    const name = nameSchema.safeParse(data.name)
    if (!name.success)
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_NAME",
        message: "Invalid name",
      })
    validated.name = name.data
  }
  if (data.email !== undefined) {
    const email = emailSchema.safeParse(data.email)
    if (!email.success)
      throw new APIError("BAD_REQUEST", {
        code: "INVALID_EMAIL",
        message: "Invalid email",
      })
    validated.email = email.data
  }
  return validated
}
