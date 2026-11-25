import { All, Controller, Inject, type RawBodyRequest, Req, Res } from "@nestjs/common"
import { ApiExcludeController } from "@nestjs/swagger"
import { fromNodeHeaders } from "better-auth/node"
import type { Request as ExpressRequest, Response as ExpressResponse } from "express"

import { createErrorResponse, describeHttpError } from "../../common/errors/error-response.js"
import { AUTH, type Auth } from "./auth.provider.js"
import { Public } from "./decorators/public.decorator.js"

// Better Auth gestiona todas sus rutas con una `Response` propia. Aquí se le pasa la petición y se copia su respuesta
// al `Response` de Express. Las respuestas correctas y las redirecciones pasan sin cambios; sus errores se reescriben
// con el contrato público de la API.
// Better Auth publica su propia referencia en desarrollo (plugin `openAPI`); aquí solo sería una ruta comodín.
@ApiExcludeController()
@Public()
@Controller("auth")
export class AuthController {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  @All("*path")
  async handle(@Req() request: RawBodyRequest<ExpressRequest>, @Res() response: ExpressResponse) {
    const authResponse = await this.auth.handler(toWebRequest(request))
    const publicResponse = authResponse.status < 400 ? authResponse : await toPublicError(authResponse, request.id)
    await sendWebResponse(publicResponse, response)
  }
}

// Reconstruye la petición con el cuerpo original: Nest ya lo leyó, pero `rawBody` conserva los bytes.
function toWebRequest(request: RawBodyRequest<ExpressRequest>) {
  const url = `${request.protocol}://${request.get("host")}${request.originalUrl}`
  const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.rawBody !== undefined
  return new Request(url, {
    method: request.method,
    headers: fromNodeHeaders(request.headers),
    body: hasBody ? new Uint8Array(request.rawBody!) : undefined,
  })
}

async function toPublicError(response: Response, requestId: string) {
  const original = await readErrorBody(response)
  const fallback = describeHttpError(response.status)
  const code = original.code ?? fallback.code
  // El mensaje de `VALIDATION_ERROR` lleva el detalle de Zod; se sustituye por un texto fijo, como el resto de códigos.
  const message = code === "VALIDATION_ERROR" ? "Validation error" : (original.message ?? fallback.message)
  const headers = new Headers(response.headers)
  headers.delete("content-length")
  return Response.json(createErrorResponse(response.status, code, message, requestId), {
    status: response.status,
    headers,
  })
}

async function readErrorBody(response: Response): Promise<{ code?: string; message?: string }> {
  try {
    const payload: unknown = JSON.parse(await response.text())
    if (typeof payload !== "object" || payload === null) return {}
    const { code, message } = payload as Record<string, unknown>
    return {
      code: typeof code === "string" ? code : undefined,
      message: typeof message === "string" ? message : undefined,
    }
  } catch {
    return {}
  }
}

async function sendWebResponse(webResponse: Response, response: ExpressResponse) {
  for (const [name, value] of webResponse.headers) {
    if (name !== "set-cookie") response.setHeader(name, value)
  }
  const cookies = webResponse.headers.getSetCookie()
  if (cookies.length > 0) response.setHeader("set-cookie", cookies)
  response.status(webResponse.status).end(Buffer.from(await webResponse.arrayBuffer()))
}
