import { registerAs } from "@nestjs/config"
import { apiBasePath } from "@autana/contracts/api"
import z from "zod"

export const openApiEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
})

// La documentación (el documento OpenAPI, la interfaz de Scalar y la referencia de Better Auth) solo se publica con
// `NODE_ENV=development`. Cualquier otro valor, o su ausencia, la oculta: así un despliegue al que le falte la variable
// no expone el contrato.
export function buildOpenApiConfig(env: Record<string, unknown>) {
  const { NODE_ENV } = openApiEnvSchema.parse(env)

  return {
    enabled: NODE_ENV === "development",
    title: "Autana Nest Full Stack Starter API",
    // Coincide con la versión de `apps/api/package.json`.
    version: "0.0.1",
    docsPath: `${apiBasePath}/docs`,
    // Scalar carga su interfaz desde jsDelivr. Se fija la versión para que el código que se ejecuta en el navegador
    // no cambie cuando Scalar publique una nueva: al actualizarla, cambia este número.
    referenceBundle: "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.83.0/esm.js",
    jsonPath: `${apiBasePath}/openapi.json`,
  }
}

export type OpenApiConfig = ReturnType<typeof buildOpenApiConfig>

export const openApiConfig = registerAs("openApi", () => buildOpenApiConfig(process.env))
