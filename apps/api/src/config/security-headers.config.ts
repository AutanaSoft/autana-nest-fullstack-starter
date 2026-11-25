import type { SecurityHeadersOptions } from "@nestjs/common"
import { registerAs } from "@nestjs/config"
import z from "zod"

export const securityHeadersEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
})

// La API solo devuelve JSON, por lo que ninguna respuesta necesita cargar recursos ni mostrarse en un marco. Fuera de
// producción se omite la CSP porque la documentación (Scalar) carga scripts, estilos y fuentes de un CDN.
export function buildSecurityHeadersConfig(env: Record<string, unknown>): SecurityHeadersOptions {
  const { NODE_ENV } = securityHeadersEnvSchema.parse(env)

  return {
    contentSecurityPolicy:
      NODE_ENV === "production"
        ? {
            useDefaults: false,
            directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
          }
        : false,
  }
}

export const securityHeadersConfig = registerAs("securityHeaders", () => buildSecurityHeadersConfig(process.env))
