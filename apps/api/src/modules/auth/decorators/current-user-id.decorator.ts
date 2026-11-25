import { createParamDecorator, type ExecutionContext } from "@nestjs/common"
import type { Request } from "express"

declare module "express-serve-static-core" {
  interface Request {
    userId?: string
  }
}

// Identificador del usuario que `SessionGuard` dejó en la petición. Solo existe en rutas que exigen sesión.
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<Request>().userId as string
})
