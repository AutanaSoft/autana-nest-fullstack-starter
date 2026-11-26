import { HttpStatusCode } from "axios"
import { healthResponseSchema } from "@autana/contracts/health"

import { apiClient } from "@/lib/api-client"

// Con algún indicador caído la API responde 503 con el mismo detalle: es un resultado que mostrar, no un error.
const isHealthResult = (status: number) => status === HttpStatusCode.Ok || status === HttpStatusCode.ServiceUnavailable

export async function fetchHealth(signal: AbortSignal) {
  const response = await apiClient.get("/health", { signal, validateStatus: isHealthResult })
  return healthResponseSchema.parse(response.data)
}
