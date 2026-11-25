import { z } from "zod"

// Cuerpo de todo error público de la API. `error` y `statusCode` salen del estado HTTP de la respuesta
// y `code` es el identificador estable que el cliente usa para decidir qué mostrar.
export const errorResponseSchema = z.object({
  message: z.string().meta({ example: "Something bad happened" }),
  error: z.string().meta({ example: "Bad Request" }),
  statusCode: z.number().int().meta({ example: 400 }),
  code: z.string().meta({ example: "SOMETHING_BAD_HAPPENED" }),
  requestId: z.string().meta({ example: "3f2b8c1e-7a4d-4e9b-a6c5-1d2e8f90b7a3" }),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
