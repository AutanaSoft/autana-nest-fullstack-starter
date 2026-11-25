import { renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"

import { authClient } from "@/lib/auth-client"

import { server } from "./server"

// Declara la respuesta de `get-session` y espera a que el cliente la consulte. El estado de sesión del cliente es global
// al módulo: sin esto, el primer render de una prueba vería el estado de la anterior.
export async function mockSession(response: Response | null | object) {
  server.use(
    http.get("*/v1/auth/get-session", () => (response instanceof Response ? response : HttpResponse.json(response)))
  )
  authClient.$store.notify("$sessionSignal")

  const { result, unmount } = renderHook(() => authClient.useSession())
  await waitFor(() => {
    if (result.current.isPending) throw new Error("La sesión sigue cargando")
  })
  unmount()
}
