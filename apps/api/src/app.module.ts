import { Module, StandardSchemaSerializerInterceptor } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import type { Request } from "express"
import { apiBasePath } from "@autana/contracts/api"

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js"
import { configurations } from "./config/index.js"
import { validateEnv } from "./config/env.validation.js"
import { rateLimitConfig, type RateLimitConfig } from "./config/rate-limit.config.js"
import { DatabaseModule } from "./database/database.module.js"
import { AuthModule } from "./modules/auth/auth.module.js"
import { HealthModule } from "./modules/health/health.module.js"
import { ProfileModule } from "./modules/profile/profile.module.js"
import { TasksModule } from "./modules/tasks/tasks.module.js"

const readMethods = ["GET", "HEAD", "OPTIONS"]

@Module({
  imports: [
    ConfigModule.forRoot({
      // Relativo al directorio desde el que se ejecuta el proceso (apps/api con los scripts del workspace). Las
      // variables del entorno prevalecen sobre las del archivo.
      envFilePath: [".env"],
      isGlobal: true,
      load: configurations,
      validate: validateEnv,
    }),
    // Las rutas de autenticación solo usan el límite global, porque Better Auth aplica su propio límite en producción.
    ThrottlerModule.forRootAsync({
      inject: [rateLimitConfig.KEY],
      useFactory: (rateLimit: RateLimitConfig) => ({
        skipIf: () => !rateLimit.enabled,
        throttlers: [
          { name: "global", ttl: rateLimit.windowMs, limit: rateLimit.globalLimit },
          {
            name: "writes",
            ttl: rateLimit.windowMs,
            limit: rateLimit.writesLimit,
            // Sustituye al `skipIf` global, por lo que repite la condición de producción.
            skipIf: (context) => {
              if (!rateLimit.enabled) return true
              const { method, path } = context.switchToHttp().getRequest<Request>()
              return readMethods.includes(method) || path.startsWith(`${apiBasePath}/auth/`)
            },
          },
        ],
      }),
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    ProfileModule,
    TasksModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Valida y filtra toda respuesta con el esquema del contrato que declara `@SerializeOptions({ schema })`.
    { provide: APP_INTERCEPTOR, useClass: StandardSchemaSerializerInterceptor },
    // Debe ir en el módulo raíz: sus guards globales se ejecutan antes que el de sesión.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
