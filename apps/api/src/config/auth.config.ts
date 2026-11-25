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
})

export function buildAuthConfig(env: Record<string, unknown>) {
  return authEnvSchema.parse(env)
}

export type AuthConfig = ReturnType<typeof buildAuthConfig>

export const authConfig = registerAs("auth", () => buildAuthConfig(process.env))
