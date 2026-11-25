import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { apiClient } from "./api-client"

describe("apiClient", () => {
  it("usa el prefijo de la API como base", () => {
    expect(apiClient.defaults.baseURL).toBe("/v1")
  })

  it("envía las cookies en las peticiones entre orígenes", () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it("resuelve las rutas relativas bajo el prefijo", async () => {
    let url = ""
    server.use(
      http.get("*/v1/probe", ({ request }) => {
        url = new URL(request.url).pathname
        return HttpResponse.json({})
      })
    )

    await apiClient.get("/probe")

    expect(url).toBe("/v1/probe")
  })
})
