import { type ArgumentsHost, BadRequestException, ForbiddenException, Logger, NotFoundException } from "@nestjs/common"
import { ThrottlerException } from "@nestjs/throttler"
import { errorResponseSchema } from "@autana/contracts/errors"

import { AllExceptionsFilter } from "./all-exceptions.filter.js"

function catchWith(exception: unknown) {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
  }
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ id: "req-1" }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost
  new AllExceptionsFilter().catch(exception, host)
  return {
    response,
    body: () => errorResponseSchema.parse(response.json.mock.calls[0][0]),
  }
}

describe("AllExceptionsFilter", () => {
  afterEach(() => vi.restoreAllMocks())

  it("usa el código y el mensaje públicos que indica la excepción", () => {
    const { response, body } = catchWith(
      new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      })
    )

    expect(response.status).toHaveBeenCalledWith(404)
    expect(body()).toEqual({
      message: "User not found",
      error: "Not Found",
      statusCode: 404,
      code: "USER_NOT_FOUND",
      requestId: "req-1",
    })
  })

  it("sustituye el detalle de una excepción sin código público por uno fijo", () => {
    const { body } = catchWith(new BadRequestException("detalle interno de validación"))

    expect(body()).toMatchObject({
      code: "BAD_REQUEST",
      message: "Bad request",
    })
  })

  it("conserva el estado de una excepción HTTP genérica", () => {
    const { response, body } = catchWith(new ForbiddenException())

    expect(response.status).toHaveBeenCalledWith(403)
    expect(body()).toMatchObject({ code: "HTTP_ERROR", message: "Forbidden" })
  })

  it("responde 429 con RATE_LIMITED y Retry-After", () => {
    const { response, body } = catchWith(new ThrottlerException())

    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "60")
    expect(body()).toMatchObject({
      code: "RATE_LIMITED",
      message: "Too many requests",
      statusCode: 429,
    })
  })

  it("responde 500 sin el detalle y lo registra con el identificador de la petición", () => {
    const log = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {})
    const error = new Error("secret internal detail")

    const { response, body } = catchWith(error)

    expect(response.status).toHaveBeenCalledWith(500)
    expect(body()).toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    })
    expect(JSON.stringify(response.json.mock.calls)).not.toContain("secret internal detail")
    expect(log).toHaveBeenCalledWith("[req-1]", error)
  })
})
