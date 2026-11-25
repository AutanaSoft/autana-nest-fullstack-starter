import { STATUS_CODES } from "node:http"
import { errorResponseSchema } from "@autana/contracts/errors"

// `error` y `statusCode` se derivan siempre del mismo estado, para que no puedan desincronizarse.
export function createErrorResponse(statusCode: number, code: string, message: string, requestId: string) {
  return errorResponseSchema.parse({
    message,
    error: STATUS_CODES[statusCode] ?? "Error",
    statusCode,
    code,
    requestId,
  })
}

// Código y mensaje públicos de un estado HTTP. El mensaje es fijo para no exponer el detalle de la excepción.
export function describeHttpError(statusCode: number) {
  if (statusCode === 400) return { code: "BAD_REQUEST", message: "Bad request" }
  if (statusCode === 404) return { code: "NOT_FOUND", message: "Resource not found" }
  if (statusCode === 415)
    return {
      code: "UNSUPPORTED_MEDIA_TYPE",
      message: "Unsupported media type",
    }
  if (statusCode === 429) return { code: "RATE_LIMITED", message: "Too many requests" }
  return { code: "HTTP_ERROR", message: STATUS_CODES[statusCode] ?? "Error" }
}
