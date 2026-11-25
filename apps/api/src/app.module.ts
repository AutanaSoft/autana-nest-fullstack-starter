import { Module, StandardSchemaSerializerInterceptor } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core"
import { ThrottlerGuard } from "@nestjs/throttler"

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js"
import { RateLimitModule } from "./common/modules/rate-limit.module.js"
import { configurations } from "./config/index.js"
import { validateEnv } from "./config/env.validation.js"
import { DatabaseModule } from "./database/database.module.js"
import { AuthModule } from "./modules/auth/auth.module.js"
import { HealthModule } from "./modules/health/health.module.js"
import { ProfileModule } from "./modules/profile/profile.module.js"
import { TasksModule } from "./modules/tasks/tasks.module.js"

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
    RateLimitModule,
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
    // Debe ir en el módulo raíz: sus guards globales se ejecutan antes que el de sesión (`AuthGuard`).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
