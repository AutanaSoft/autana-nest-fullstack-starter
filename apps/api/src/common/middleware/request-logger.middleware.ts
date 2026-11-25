import { Logger } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"

const logger = new Logger("HTTP")

// Registra una línea por petición con su identificador, para localizarla junto al error. No registra cabeceras ni
// cuerpos, que pueden contener credenciales.
export function requestLogger(request: Request, response: Response, next: NextFunction) {
  const start = performance.now()
  response.on("finish", () => {
    const elapsedMs = Math.round(performance.now() - start)
    logger.log(`[${request.id}] ${request.method} ${request.originalUrl} ${response.statusCode} ${elapsedMs}ms`)
  })
  next()
}
