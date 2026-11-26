import { healthResponseSchema } from "./health"
import { describe, expect, it } from "vitest"

describe("healthResponseSchema", () => {
  it("acepta una respuesta correcta y conserva los datos propios de cada indicador", () => {
    const response = {
      status: "ok",
      info: { database: { status: "up", responseTime: 3 } },
      error: {},
      details: { database: { status: "up", responseTime: 3 } },
    }

    expect(healthResponseSchema.parse(response)).toEqual(response)
  })

  it("acepta una respuesta con un indicador caído y su mensaje", () => {
    const response = {
      status: "error",
      info: {},
      error: { database: { status: "down", message: "timeout" } },
      details: { database: { status: "down", message: "timeout" } },
    }

    expect(healthResponseSchema.safeParse(response).success).toBe(true)
  })

  it.each([
    { status: "ok" },
    { status: "unknown", details: {} },
    { status: "ok", details: { database: { status: "unknown" } } },
  ])("rechaza %j", (response) => {
    expect(healthResponseSchema.safeParse(response).success).toBe(false)
  })
})
