import type { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { apiBasePath } from "@autana/contracts/api"
import compression from "compression"

import "./common/openapi/openapi-schemas.js"
import { requestId } from "./common/middleware/request-id.middleware.js"
import { requestLogger } from "./common/middleware/request-logger.middleware.js"
import { appConfig } from "./config/app.config.js"
import { corsConfig } from "./config/cors.config.js"
import { openApiConfig } from "./config/openapi.config.js"
import { securityHeadersConfig } from "./config/security-headers.config.js"

// Configuración de la aplicación que no es un módulo. Se separa de `main.ts` para que las pruebas e2e arranquen la
// misma aplicación. La aplicación debe crearse con `rawBody: true`: Better Auth recibe los bytes originales.
export function configureApp(app: NestExpressApplication) {
  const { WEB_ORIGIN: webOrigin, TRUST_PROXY } = app.get(appConfig.KEY)
  const openApi = app.get(openApiConfig.KEY)

  if (TRUST_PROXY) app.set("trust proxy", 1)

  // El orden importa: el identificador de la petición debe existir antes que cualquier otro middleware, incluido el
  // rechazo de CSRF, y CORS debe ir antes de CSRF para que el 403 lleve sus cabeceras.
  app.use(requestId, requestLogger)
  app.useSecurityHeaders(app.get(securityHeadersConfig.KEY))
  // Solo el origen del frontend, con cookies. Con el frontend y la API en el mismo origen el navegador no lo usa.
  app.enableCors(app.get(corsConfig.KEY))
  // Comprime con gzip las respuestas de más de 1 kB que el cliente acepta.
  app.use(compression())
  // Comprueba `Sec-Fetch-Site` y `Origin` en toda petición que cambia estado, también las de las rutas de
  // autenticación. El origen del frontend es de confianza: CORS no lo es automáticamente.
  app.enableCsrfProtection({ trustedOrigins: [webOrigin] })
  app.setGlobalPrefix(apiBasePath)

  // La documentación solo se publica en desarrollo; en cualquier otro caso responde 404.
  if (openApi.enabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle(openApi.title).setVersion(openApi.version).build()
    )
    // Nest solo sirve el documento JSON; la interfaz la sirve Scalar a partir de él.
    SwaggerModule.setup(openApi.docsPath, app, document, { ui: false, jsonDocumentUrl: openApi.jsonPath })
    app.use(openApi.docsPath, apiReference({ url: openApi.jsonPath, bundle: openApi.referenceBundle }))
  }

  app.enableShutdownHooks()
}
