import type { NextFunction, Request, Response } from "express"

// Impide que el navegador o un proxy guarden respuestas con datos del usuario. Se fija antes de la ruta para que
// también alcance a las respuestas de error, como el `401` del guard de sesión.
export function noStore(_request: Request, response: Response, next: NextFunction) {
  response.setHeader("Cache-Control", "no-store")
  next()
}
