import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common"

import { noStore } from "../../common/middleware/no-store.middleware.js"
import { TasksController } from "./tasks.controller.js"
import { TasksService } from "./services/tasks.service.js"

@Module({ controllers: [TasksController], providers: [TasksService] })
export class TasksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(noStore).forRoutes(TasksController)
  }
}
