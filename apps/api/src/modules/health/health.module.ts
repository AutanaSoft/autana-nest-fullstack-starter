import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common"
import { TerminusModule } from "@nestjs/terminus"

import { noStore } from "../../common/middleware/no-store.middleware.js"
import { HealthController } from "./health.controller.js"
import { DatabaseHealthIndicator } from "./indicators/database.health.js"

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(noStore).forRoutes(HealthController)
  }
}
