import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common"

import { noStore } from "../../common/middleware/no-store.middleware.js"
import { ProfileController } from "./profile.controller.js"
import { ProfileService } from "./services/profile.service.js"

@Module({ controllers: [ProfileController], providers: [ProfileService] })
export class ProfileModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(noStore).forRoutes(ProfileController)
  }
}
