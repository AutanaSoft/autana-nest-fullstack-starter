import { z } from "zod"

export const healthResponseSchema = z.object({
  status: z.literal("ok").meta({ example: "ok" }),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>
