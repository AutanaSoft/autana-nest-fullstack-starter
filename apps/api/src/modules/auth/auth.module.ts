import { Module } from "@nestjs/common"
import { getDrizzleToken } from "@nestjs/drizzle"
import { AuthModule as BetterAuthModule } from "@thallesp/nestjs-better-auth"

import { appConfig, type AppConfig } from "../../config/app.config.js"
import { authConfig, type AuthConfig } from "../../config/auth.config.js"
import { openApiConfig, type OpenApiConfig } from "../../config/openapi.config.js"
import type { Database } from "../../database/database.js"
import { createAuth } from "./auth.js"
import { UserValidationHook } from "./user-validation.hook.js"

// Monta Better Auth en `/v1/auth` como middleware (sin pasar por guards, interceptores ni filtros de Nest) y registra
// un guard global: toda ruta exige sesión salvo las marcadas con `@AllowAnonymous()`.
@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      isGlobal: true,
      inject: [getDrizzleToken(), authConfig.KEY, openApiConfig.KEY, appConfig.KEY],
      useFactory: (db: Database, auth: AuthConfig, openApi: OpenApiConfig, app: AppConfig) => ({
        auth: createAuth(db, auth, openApi, app),
        // Nest ya aplica `enableCors` con el origen del frontend y las cabeceras de la API (`app.setup.ts`).
        disableTrustedOriginsCors: true,
        // Con `bodyParser: false` en `main.ts`, la librería vuelve a registrar los parsers fuera de las rutas de auth,
        // con el mismo límite que tenía Nest.
        bodyParser: { json: { limit: "100kb" }, urlencoded: { limit: "100kb", extended: true } },
      }),
    }),
  ],
  providers: [UserValidationHook],
})
export class AuthModule {}
