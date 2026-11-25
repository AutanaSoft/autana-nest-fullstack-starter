import { randomUUID } from "node:crypto"
import type { NextFunction, Request, Response } from "express"

declare module "express-serve-static-core" {
  interface Request {
    id: string
  }
}

const validRequestId = /^[\w=-]{1,255}$/

// Reutiliza el `X-Request-Id` de la petición si es razonable y, si no, genera uno. Debe ir antes que cualquier otro
// middleware para que todos los errores y registros lo conozcan.
export function requestId(request: Request, response: Response, next: NextFunction) {
  const incoming = request.get("x-request-id")
  request.id = incoming && validRequestId.test(incoming) ? incoming : randomUUID()
  response.setHeader("X-Request-Id", request.id)
  next()
}
