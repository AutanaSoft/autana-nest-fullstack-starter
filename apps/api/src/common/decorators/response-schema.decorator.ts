import { applyDecorators, SerializeOptions, type StandardSchemaSerializerContextOptions } from "@nestjs/common"
import { ApiResponse } from "@nestjs/swagger"

type Schema = NonNullable<StandardSchemaSerializerContextOptions["schema"]>

// Declara una sola vez el esquema de la respuesta correcta: el interceptor de serialización lo usa para validar y
// filtrar lo que sale, y Swagger lo publica en la documentación.
export function ResponseSchema(schema: Schema, status = 200) {
  return applyDecorators(SerializeOptions({ schema }), ApiResponse({ status, standardSchema: schema }))
}
