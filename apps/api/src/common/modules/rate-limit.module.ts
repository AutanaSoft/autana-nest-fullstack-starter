import { Module } from "@nestjs/common"
import { ThrottlerModule } from "@nestjs/throttler"
import type { Request } from "express"

import { appConfig, type AppConfig } from "../../config/app.config.js"
import { rateLimitConfig, type RateLimitConfig } from "../../config/rate-limit.config.js"

const readMethods = ["GET", "HEAD", "OPTIONS"]

// Configura el límite de peticiones por IP: uno global y otro más estricto para las escrituras. Solo configura:
// `ThrottlerGuard` se registra en `AppModule`, para que se ejecute antes que el guard de sesión. Las rutas de
// `/v1/auth/*` no pasan por él, porque Better Auth las atiende como middleware y aplica su propio límite.
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [rateLimitConfig.KEY, appConfig.KEY],
      useFactory: (rateLimit: RateLimitConfig, app: AppConfig) => ({
        skipIf: () => !rateLimit.enabled,
        // Con `CLIENT_IP_HEADER` cuenta por la IP de esa cabecera; si no llega, por la de la conexión.
        getTracker: (request) => {
          const clientIp = app.CLIENT_IP_HEADER && (request as Request).get(app.CLIENT_IP_HEADER)
          return clientIp || request.ip || ""
        },
        throttlers: [
          { name: "global", ttl: rateLimit.windowMs, limit: rateLimit.globalLimit },
          {
            name: "writes",
            ttl: rateLimit.windowMs,
            limit: rateLimit.writesLimit,
            // Sustituye al `skipIf` global, por lo que repite la condición de producción.
            skipIf: (context) =>
              !rateLimit.enabled || readMethods.includes(context.switchToHttp().getRequest<Request>().method),
          },
        ],
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
