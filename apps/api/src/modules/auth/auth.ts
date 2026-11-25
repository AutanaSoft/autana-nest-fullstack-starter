import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { openAPI } from "better-auth/plugins"
import { apiBasePath } from "@autana/contracts/api"
import { passwordLength } from "@autana/contracts/auth"
import * as schema from "@autana/database/schema/auth"

import type { AuthConfig } from "../../config/auth.config.js"
import type { OpenApiConfig } from "../../config/openapi.config.js"
import type { Database } from "../../database/database.js"

export function createAuth(db: Database, auth: AuthConfig, openApi: OpenApiConfig) {
  return betterAuth({
    basePath: `${apiBasePath}/auth`,
    baseURL: auth.BETTER_AUTH_URL,
    secret: auth.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: passwordLength.min,
      maxPasswordLength: passwordLength.max,
    },
    // Vacíos a propósito: `@thallesp/nestjs-better-auth` los necesita para registrar los hooks que declaran las clases
    // con `@Hook()` y `@DatabaseHook()`, como `UserValidationHook`.
    hooks: {},
    databaseHooks: {},
    advanced: {
      // Con PostgreSQL, "uuid" deja que la base de datos genere el id de cada tabla.
      database: { generateId: "uuid", joins: true },
      // Sin esta cabecera Better Auth lee `X-Forwarded-For`, que sin proxy es falsificable y, con una cadena de proxies,
      // no permite resolver la IP: todos los clientes compartirían el contador de intentos.
      ...(auth.CLIENT_IP_HEADER && { ipAddress: { ipAddressHeaders: [auth.CLIENT_IP_HEADER] } }),
      // La URL pública suele ser `https` aunque el proceso reciba `http` de un proxy: no se deja a su esquema.
      ...(auth.NODE_ENV === "production" && { useSecureCookies: true }),
    },
    trustedOrigins: [auth.WEB_ORIGIN],
    // La referencia solo se publica en desarrollo, igual que el resto de la documentación.
    plugins: openApi.enabled ? [openAPI()] : [],
  })
}

export type Auth = ReturnType<typeof createAuth>
