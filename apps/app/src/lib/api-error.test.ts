import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { apiClient } from "./api-client"
import { getApiErrorCode } from "./api-error"

async function failWith(response: Response) {
  server.use(http.get("*/v1/probe", () => response))
  return apiClient.get("/probe").catch((error: unknown) => error)
}

describe("getApiErrorCode", () => {
  it("devuelve el code del cuerpo de error de la API", async () => {
    const error = await failWith(
      HttpResponse.json(
        { message: "Task not found", error: "Not Found", statusCode: 404, code: "TASK_NOT_FOUND", requestId: "r1" },
        { status: 404 }
      )
    )

    expect(getApiErrorCode(error)).toBe("TASK_NOT_FOUND")
  })

  it("devuelve null si el cuerpo no es un error de la API", async () => {
    expect(getApiErrorCode(await failWith(HttpResponse.text("Bad gateway", { status: 502 })))).toBeNull()
  })

  it("devuelve null si el fallo no vino de Axios", () => {
    expect(getApiErrorCode(new Error("boom"))).toBeNull()
  })

  it("devuelve null ante una caída de red", async () => {
    expect(getApiErrorCode(await failWith(HttpResponse.error()))).toBeNull()
  })
})
