import { authClient } from "@/lib/auth-client"

import type { SignInValues } from "@autana/contracts/auth"

const genericMessage = "No se pudo iniciar sesión. Inténtalo de nuevo."

export async function signIn(values: SignInValues) {
  // El cliente devuelve los errores de la API, pero lanza una excepción cuando falla la red.
  const result = await authClient.signIn.email(values).catch(() => null)
  if (!result) throw new Error(genericMessage)
  if (!result.error) return

  throw new Error(
    result.error.code === "INVALID_EMAIL_OR_PASSWORD" ? "Correo o contraseña incorrectos." : genericMessage
  )
}
