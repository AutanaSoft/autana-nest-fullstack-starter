import z from "zod"
import { errorResponseSchema } from "@autana/contracts/errors"
import { healthIndicatorSchema, healthResponseSchema } from "@autana/contracts/health"

// Los esquemas con `id` se publican una sola vez en `components.schemas` y el resto del documento los referencia, en
// lugar de repetirlos en cada operación. El registro es global, por lo que solo se puede hacer una vez por proceso:
// se hace al importar este módulo.
const schemaIds = {
  HealthIndicator: healthIndicatorSchema,
  HealthResponse: healthResponseSchema,
  ErrorResponse: errorResponseSchema,
}

for (const [id, schema] of Object.entries(schemaIds)) z.globalRegistry.add(schema, { id })
