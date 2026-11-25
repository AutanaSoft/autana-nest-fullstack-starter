import { appConfig } from "./app.config.js"
import { authConfig } from "./auth.config.js"
import { corsConfig } from "./cors.config.js"
import { databaseConfig } from "./database.config.js"
import { openApiConfig } from "./openapi.config.js"
import { rateLimitConfig } from "./rate-limit.config.js"
import { securityHeadersConfig } from "./security-headers.config.js"

export const configurations = [
  appConfig,
  databaseConfig,
  authConfig,
  corsConfig,
  securityHeadersConfig,
  rateLimitConfig,
  openApiConfig,
]
