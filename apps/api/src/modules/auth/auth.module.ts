import { Module } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"

import { AuthController } from "./auth.controller.js"
import { authProvider } from "./auth.provider.js"
import { SessionGuard } from "./guards/session.guard.js"

// El guard de sesión es global: toda ruta exige sesión salvo las marcadas con `@Public()`.
@Module({
  controllers: [AuthController],
  providers: [authProvider, { provide: APP_GUARD, useClass: SessionGuard }],
})
export class AuthModule {}
