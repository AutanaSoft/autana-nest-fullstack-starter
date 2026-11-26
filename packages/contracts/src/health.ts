import { z } from "zod"

// Resultado de un indicador de Terminus. `message` solo aparece cuando falla, y `responseTime` (en milisegundos), en los
// indicadores que comprueban con `attempt()`. Un indicador puede añadir otros campos, que se conservan sin validarlos.
export const healthIndicatorSchema = z.looseObject({
  status: z.enum(["up", "degraded", "down"]).meta({ example: "up" }),
  message: z.string().optional(),
  responseTime: z.number().optional().meta({ example: 3 }),
})

const healthIndicatorsSchema = z.record(z.string(), healthIndicatorSchema)

// Formato de respuesta de Terminus: `details` reúne todos los indicadores, e `info` y `error` los separan según su
// estado. Con `status: "error"` la API responde 503 con este mismo cuerpo.
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error", "shutting_down"]).meta({ example: "ok" }),
  info: healthIndicatorsSchema.optional(),
  error: healthIndicatorsSchema.optional(),
  details: healthIndicatorsSchema,
})

export type HealthIndicator = z.infer<typeof healthIndicatorSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
