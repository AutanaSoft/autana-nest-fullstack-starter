import { isAxiosError } from "axios"
import { errorResponseSchema } from "@autana/contracts/errors"

// Código público del error de la API, o `null` si el fallo no vino de ella (por ejemplo, una caída de red).
// El cliente decide qué mostrar según el código, nunca según el `message`.
export function getApiErrorCode(error: unknown) {
  if (!isAxiosError(error)) return null
  const body = errorResponseSchema.safeParse(error.response?.data)
  return body.success ? body.data.code : null
}
