import { authClient } from "@/lib/auth-client"

import type { SignUpValues } from "@autana/contracts/auth"

// El mensaje es genérico a propósito: distinguir un correo ya registrado revelaría qué cuentas existen.
const genericMessage = "No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo."

export async function signUp(values: SignUpValues) {
  // El cliente devuelve los errores de la API, pero lanza una excepción cuando falla la red.
  const result = await authClient.signUp.email(values).catch(() => null)
  if (!result || result.error) throw new Error(genericMessage)
}
