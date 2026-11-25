import { registerAs } from "@nestjs/config"
import z from "zod"

export const rateLimitEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
})

// Fuera de producción no se limita, para que las pruebas y el desarrollo no choquen con el límite. Los contadores
// viven en la memoria del proceso: valen para una sola instancia.
export function buildRateLimitConfig(env: Record<string, unknown>) {
  const { NODE_ENV } = rateLimitEnvSchema.parse(env)

  return {
    enabled: NODE_ENV === "production",
    // Ventana común a los dos límites, en milisegundos.
    windowMs: 60_000,
    // Peticiones por ventana e IP en todas las rutas.
    globalLimit: 100,
    // Peticiones por ventana e IP en las escrituras.
    writesLimit: 20,
  }
}

export type RateLimitConfig = ReturnType<typeof buildRateLimitConfig>

export const rateLimitConfig = registerAs("rateLimit", () => buildRateLimitConfig(process.env))
