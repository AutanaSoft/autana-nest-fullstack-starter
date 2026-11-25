import { registerAs } from "@nestjs/config"
import z from "zod"

export const appEnvSchema = z.object({
  // Una variable vacía (`PORT=`) se trata como no definida y usa el puerto por defecto.
  PORT: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(1).max(65535).default(3000)
  ),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  // Activar solo detrás de un proxy inverso que añada la IP del cliente a `X-Forwarded-For`; si no, es falsificable.
  TRUST_PROXY: z.stringbool().default(false),
  // Cabecera de la que se toma la IP del cliente para los límites de peticiones de Nest y de Better Auth, por ejemplo
  // `CF-Connecting-IP` detrás de Cloudflare. Solo es fiable si el proxy la sobrescribe siempre y el servidor no acepta
  // tráfico que no pase por él. Una variable vacía se trata como no definida. Si falta la cabecera, el límite de Nest usa
  // la IP de la conexión.
  CLIENT_IP_HEADER: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .regex(/^[A-Za-z0-9-]+$/)
      .transform((name) => name.toLowerCase())
      .optional()
  ),
})

export function buildAppConfig(env: Record<string, unknown>) {
  return appEnvSchema.parse(env)
}

export type AppConfig = ReturnType<typeof buildAppConfig>

export const appConfig = registerAs("app", () => buildAppConfig(process.env))
