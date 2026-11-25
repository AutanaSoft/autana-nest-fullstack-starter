import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"

import { AppModule } from "./app.module.js"
import { configureApp } from "./app.setup.js"
import { appConfig } from "./config/app.config.js"

async function bootstrap() {
  // `rawBody` conserva los bytes de la petición para pasárselos a Better Auth.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  })
  configureApp(app)
  await app.listen(app.get(appConfig.KEY).PORT)
}

await bootstrap()
