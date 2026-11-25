import { registerAs } from "@nestjs/config"
import z from "zod"

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url(),
})

export function buildDatabaseConfig(env: Record<string, unknown>) {
  return databaseEnvSchema.parse(env)
}

export type DatabaseConfig = ReturnType<typeof buildDatabaseConfig>

export const databaseConfig = registerAs("database", () => buildDatabaseConfig(process.env))
