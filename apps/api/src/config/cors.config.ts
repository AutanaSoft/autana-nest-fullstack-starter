import { registerAs } from "@nestjs/config"
import type { NestExpressApplication } from "@nestjs/platform-express"
import z from "zod"

// `CorsOptions` no se exporta desde `@nestjs/common`: se obtiene del parámetro de `enableCors`. Al declararlo como tipo
// de retorno, el compilador detecta una clave desconocida.
type CorsOptions = Exclude<
  Parameters<NestExpressApplication["enableCors"]>[0],
  ((...args: never[]) => unknown) | undefined
>

export const corsEnvSchema = z.object({
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
})

export function buildCorsConfig(env: Record<string, unknown>): CorsOptions {
  const { WEB_ORIGIN } = corsEnvSchema.parse(env)

  return {
    origin: WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 600,
  }
}

export const corsConfig = registerAs("cors", () => buildCorsConfig(process.env))
