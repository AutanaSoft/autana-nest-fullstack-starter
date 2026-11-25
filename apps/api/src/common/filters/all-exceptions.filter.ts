import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common"
import type { Request, Response } from "express"

import { createErrorResponse, describeHttpError } from "../errors/error-response.js"

// Un servicio o guard puede indicar su propio código público lanzando `new XException({ code, message })`.
function readPublicError(exception: HttpException): { code: string; message: string } | undefined {
  const body = exception.getResponse()
  if (typeof body !== "object" || body === null) return undefined
  const { code, message } = body as Record<string, unknown>
  return typeof code === "string" && typeof message === "string" ? { code, message } : undefined
}

// Da a todos los errores el contrato público de la API. El detalle de los inesperados va solo al log, junto con el
// identificador de la petición para localizarlo.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const { code, message } = readPublicError(exception) ?? describeHttpError(status)
      if (status === HttpStatus.TOO_MANY_REQUESTS) response.setHeader("Retry-After", "60")
      response.status(status).json(createErrorResponse(status, code, message, request.id))
      return
    }

    this.logger.error(`[${request.id}]`, exception)
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(createErrorResponse(500, "INTERNAL_ERROR", "Internal server error", request.id))
  }
}
