import { authClient } from "@/lib/auth-client"

import type { SignInValues } from "@autana/contracts/auth"

const genericMessage = "No se pudo iniciar sesión. Inténtalo de nuevo."

// `BANNED_USER` es el código del plugin `admin` de Better Auth para una cuenta suspendida.
const errorMessages = new Map([
  ["INVALID_EMAIL_OR_PASSWORD", "Correo o contraseña incorrectos."],
  ["BANNED_USER", "Tu cuenta está suspendida. Contacta con soporte."],
])

export async function signIn(values: SignInValues) {
  // El cliente devuelve los errores de la API, pero lanza una excepción cuando falla la red.
  const result = await authClient.signIn.email(values).catch(() => null)
  if (!result) throw new Error(genericMessage)
  if (!result.error) return

  throw new Error(errorMessages.get(result.error.code ?? "") ?? genericMessage)
}
