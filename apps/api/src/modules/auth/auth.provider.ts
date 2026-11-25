import type { Provider } from "@nestjs/common"
import { getDrizzleToken } from "@nestjs/drizzle"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { openAPI } from "better-auth/plugins"
import { apiBasePath } from "@autana/contracts/api"
import { passwordLength } from "@autana/contracts/auth"
import * as schema from "@autana/database/schema/auth"

import { authConfig, type AuthConfig } from "../../config/auth.config.js"
import { openApiConfig, type OpenApiConfig } from "../../config/openapi.config.js"
import type { Database } from "../../database/database.js"
import { validateUserFields } from "./user-validation.js"

function createAuth(db: Database, auth: AuthConfig, openApi: OpenApiConfig) {
  return betterAuth({
    basePath: `${apiBasePath}/auth`,
    baseURL: auth.BETTER_AUTH_URL,
    secret: auth.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: passwordLength.min,
      maxPasswordLength: passwordLength.max,
    },
    // El nombre y el correo se validan al crear y al modificar un usuario, no solo en el formulario.
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({ data: validateUserFields(user) }),
        },
        update: {
          before: async (user) => ({ data: validateUserFields(user) }),
        },
      },
    },
    // Con PostgreSQL, "uuid" deja que la base de datos genere el id de cada tabla.
    advanced: { database: { generateId: "uuid" } },
    trustedOrigins: [auth.WEB_ORIGIN],
    // La referencia solo se publica en desarrollo, igual que el resto de la documentación.
    plugins: openApi.enabled ? [openAPI()] : [],
  })
}

export type Auth = ReturnType<typeof createAuth>

export const AUTH = Symbol("AUTH")

export const authProvider: Provider = {
  provide: AUTH,
  inject: [getDrizzleToken(), authConfig.KEY, openApiConfig.KEY],
  useFactory: createAuth,
}
