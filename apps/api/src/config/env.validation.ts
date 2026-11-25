import z from "zod"

import { appEnvSchema } from "./app.config.js"
import { authEnvSchema } from "./auth.config.js"
import { corsEnvSchema } from "./cors.config.js"
import { databaseEnvSchema } from "./database.config.js"
import { openApiEnvSchema } from "./openapi.config.js"
import { rateLimitEnvSchema } from "./rate-limit.config.js"
import { securityHeadersEnvSchema } from "./security-headers.config.js"

// Cada dominio declara las variables que lee, así que una variable puede aparecer en varios esquemas. Si sus
// declaraciones difirieran, el `spread` sobrescribiría la anterior sin avisar: `env.validation.spec.ts` comprueba que
// se comportan igual.
export const envSchemas = [
  appEnvSchema,
  databaseEnvSchema,
  authEnvSchema,
  corsEnvSchema,
  securityHeadersEnvSchema,
  rateLimitEnvSchema,
  openApiEnvSchema,
]

const envSchema = z.object({
  ...appEnvSchema.shape,
  ...databaseEnvSchema.shape,
  ...authEnvSchema.shape,
  ...corsEnvSchema.shape,
  ...securityHeadersEnvSchema.shape,
  ...rateLimitEnvSchema.shape,
  ...openApiEnvSchema.shape,
})

// Valida todo el entorno de una vez al arrancar y nombra cada variable inválida, no solo la primera.
export function validateEnv(env: Record<string, unknown>) {
  const result = envSchema.safeParse(env)
  if (result.success) return result.data

  const problems = result.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
  throw new Error(`Invalid environment variables:\n${problems.join("\n")}`)
}
