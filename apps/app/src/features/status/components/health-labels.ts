import type { HealthIndicator, HealthResponse } from "@autana/contracts/health"

// Nombres de los indicadores que devuelve `GET /health`. Uno sin nombre aquí se muestra con su clave.
export const indicatorLabels: Record<string, string> = {
  database: "Base de datos",
  memory_heap: "Memoria (heap)",
  memory_rss: "Memoria (RSS)",
  disk: "Disco",
}

export const overallStatusLabels: Record<HealthResponse["status"], string> = {
  ok: "Operativa",
  degraded: "Degradada",
  error: "Con fallos",
  shutting_down: "Apagándose",
}

export const indicatorStatusLabels: Record<HealthIndicator["status"], string> = {
  up: "Disponible",
  degraded: "Degradado",
  down: "Caído",
}
