import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, it, vi } from "vitest"

import { server } from "@/test/server"

// El cliente se crea al importar el módulo, así que cada prueba lo importa de nuevo con su propio entorno.
async function importAuthClient() {
  vi.resetModules()
  return (await import("./auth-client")).authClient
}

describe("authClient", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("usa el origen actual si no hay VITE_API_URL", async () => {
    vi.stubEnv("VITE_API_URL", "")
    let origin: string | undefined
    server.use(
      http.get("*/v1/auth/get-session", ({ request }) => {
        origin = new URL(request.url).origin
        return HttpResponse.json(null)
      })
    )

    await (await importAuthClient()).getSession()

    expect(origin).toBe(window.location.origin)
  })

  it("llama a la API indicada en VITE_API_URL", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.com")
    let origin: string | undefined
    server.use(
      http.get("*/v1/auth/get-session", ({ request }) => {
        origin = new URL(request.url).origin
        return HttpResponse.json(null)
      })
    )

    await (await importAuthClient()).getSession()

    expect(origin).toBe("https://api.example.com")
  })
})
