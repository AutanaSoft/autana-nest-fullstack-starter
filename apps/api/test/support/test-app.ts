import type { NestExpressApplication } from "@nestjs/platform-express"
import type { Type } from "@nestjs/common"
import { vi } from "vitest"

type TestAppOptions = {
  // Variables de entorno que debe ver la aplicación. `undefined` borra la variable. Con alguna, la aplicación se
  // importa de nuevo: `NODE_ENV` y el resto de la configuración se leen al cargar `AppModule`.
  env?: Record<string, string | undefined>
  // Controladores extra, para provocar errores que la API no produce por sí sola.
  controllers?: Type[]
}

// Arranca la misma aplicación que `main.ts`: `AppModule` más `configureApp`. Las importaciones son dinámicas para que
// todo salga de la misma carga de módulos cuando se cambia el entorno. Con el entorno modificado, quien llama debe
// restaurarlo con `vi.unstubAllEnvs()`.
export async function createTestApp({ env, controllers = [] }: TestAppOptions = {}) {
  if (env) {
    vi.resetModules()
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value as string)
  }
  const { Test } = await import("@nestjs/testing")
  const { AppModule } = await import("../../src/app.module.js")
  const { configureApp } = await import("../../src/app.setup.js")

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers,
  }).compile()
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    rawBody: true,
  })
  configureApp(app)
  await app.init()
  return app
}
