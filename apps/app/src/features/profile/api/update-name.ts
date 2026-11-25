import { authClient } from "@/lib/auth-client"

// El nombre es un dato de la cuenta, no del perfil: lo guarda Better Auth. El cliente devuelve los errores de la API,
// pero lanza una excepción cuando falla la red; en ambos casos esta función lanza.
export async function updateName(name: string) {
  const result = await authClient.updateUser({ name })
  if (result.error) throw new Error("No se pudo guardar el nombre.")
}
