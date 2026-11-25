import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { fromNodeHeaders } from "better-auth/node"
import type { Request } from "express"

import { AUTH, type Auth } from "../auth.provider.js"
import { IS_PUBLIC } from "../decorators/public.decorator.js"

// Exige una sesión válida en todas las rutas salvo las marcadas con `@Public()` y publica el identificador del
// usuario. Sin sesión responde `401` con un mensaje fijo, que no distingue entre una cookie ausente, caducada o
// manipulada.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH) private readonly auth: Auth
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<Request>()
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })
    if (!session)
      throw new UnauthorizedException({
        code: "SESSION_REQUIRED",
        message: "Session required",
      })

    request.userId = session.user.id
    return true
  }
}
