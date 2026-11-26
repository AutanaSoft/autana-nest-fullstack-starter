import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { fetchHealth } from "./fetch-health"

const signal = new AbortController().signal

describe("fetchHealth", () => {
  it("devuelve el detalle de salud de la API", async () => {
    const health = { status: "ok", info: {}, error: {}, details: { database: { status: "up" } } }
    server.use(http.get("*/v1/health", () => HttpResponse.json(health)))

    await expect(fetchHealth(signal)).resolves.toEqual(health)
  })

  it("devuelve el detalle también cuando la API responde 503", async () => {
    const health = {
      status: "error",
      info: {},
      error: { database: { status: "down", message: "timeout" } },
      details: { database: { status: "down", message: "timeout" } },
    }
    server.use(http.get("*/v1/health", () => HttpResponse.json(health, { status: 503 })))

    await expect(fetchHealth(signal)).resolves.toEqual(health)
  })

  it("lanza ante otros errores, como la falta de sesión", async () => {
    server.use(http.get("*/v1/health", () => HttpResponse.json({}, { status: 401 })))

    await expect(fetchHealth(signal)).rejects.toThrow()
  })
})
