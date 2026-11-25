import { registerAs } from "@nestjs/config"
import z from "zod"

// Better Auth recibe `secret` y `baseURL` desde esta configuración; se validan aquí para fallar al arrancar.
export const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  // Una ruta en la URL tendría prioridad sobre el basePath de Better Auth, que se fija en auth.ts.
  BETTER_AUTH_URL: z.url().refine((url) => new URL(url).pathname === "/", {
    error: "No debe incluir una ruta",
  }),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  NODE_ENV: z.string().optional(),
  // Cabecera de la que Better Auth toma la IP del cliente para su límite de intentos, por ejemplo `CF-Connecting-IP`
  // detrás de Cloudflare. Solo es fiable si el proxy la sobrescribe siempre y el servidor no acepta tráfico que no pase
  // por él. Una variable vacía se trata como no definida.
  CLIENT_IP_HEADER: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .regex(/^[A-Za-z0-9-]+$/)
      .transform((name) => name.toLowerCase())
      .optional()
  ),
})

export function buildAuthConfig(env: Record<string, unknown>) {
  return authEnvSchema.parse(env)
}

export type AuthConfig = ReturnType<typeof buildAuthConfig>

export const authConfig = registerAs("auth", () => buildAuthConfig(process.env))
