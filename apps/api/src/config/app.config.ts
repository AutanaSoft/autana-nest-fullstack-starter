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
})

export function buildAppConfig(env: Record<string, unknown>) {
  return appEnvSchema.parse(env)
}

export type AppConfig = ReturnType<typeof buildAppConfig>

export const appConfig = registerAs("app", () => buildAppConfig(process.env))
