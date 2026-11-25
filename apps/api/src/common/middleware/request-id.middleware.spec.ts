import type { Request, Response } from "express"

import { requestId } from "./request-id.middleware.js"

function run(incoming?: string) {
  const request = { get: () => incoming } as unknown as Request & { id: string }
  const response = { setHeader: vi.fn() } as unknown as Response & {
    setHeader: ReturnType<typeof vi.fn>
  }
  const next = vi.fn()
  requestId(request, response, next)
  return { request, response, next }
}

describe("requestId", () => {
  it("genera un identificador cuando el cliente no envía uno", () => {
    const { request, response, next } = run()

    expect(request.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", request.id)
    expect(next).toHaveBeenCalledOnce()
  })

  it("reutiliza el identificador válido del cliente", () => {
    expect(run("mi-id_123").request.id).toBe("mi-id_123")
  })

  it.each(["¡malo!", "con espacios", "a".repeat(256)])("sustituye el identificador no permitido %j", (incoming) => {
    expect(run(incoming).request.id).toMatch(/^[0-9a-f-]{36}$/)
  })
})
