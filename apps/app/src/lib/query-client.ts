import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import { getApiErrorCode } from "./api-error"
import { authClient } from "./auth-client"

// Si la API dice que no hay sesión (por ejemplo, porque caducó), se vuelve a consultar la sesión: el layout protegido
// ve que ya no existe y redirige al acceso.
function handleError(error: unknown) {
  if (getApiErrorCode(error) === "SESSION_REQUIRED") authClient.$store.notify("$sessionSignal")
}

// Reintenta dos veces, y solo ante una caída de red o un error del servidor: un 4xx no cambia al repetirlo.
function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 2 || !isAxiosError(error)) return false
  return !error.response || error.response.status >= 500
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: { queries: { retry: shouldRetry } },
  })
}
