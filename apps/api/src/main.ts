import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"

import { AppModule } from "./app.module.js"
import { configureApp } from "./app.setup.js"
import { appConfig } from "./config/app.config.js"

async function bootstrap() {
  // `AuthModule` desactiva el parser de cuerpo de Nest y registra el suyo fuera de las rutas de Better Auth.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  configureApp(app)
  await app.listen(app.get(appConfig.KEY).PORT)
}

await bootstrap()
