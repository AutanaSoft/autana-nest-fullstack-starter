import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { apiClient } from "./api-client"
import { authClient } from "./auth-client"
import { createQueryClient } from "./query-client"
import { server } from "@/test/server"

// El estado de sesión del cliente es global al módulo: se deja pasar un instante para contar solo las peticiones nuevas.
const settle = () => new Promise((resolve) => setTimeout(resolve, 100))

const sessionRequired = {
  message: "Session required",
  error: "Unauthorized",
  statusCode: 401,
  code: "SESSION_REQUIRED",
  requestId: "r1",
}

describe("createQueryClient", () => {
  it("vuelve a consultar la sesión cuando la API responde SESSION_REQUIRED", async () => {
    let sessionRequests = 0
    server.use(
      http.get("*/v1/auth/get-session", () => {
        sessionRequests++
        return HttpResponse.json(null)
      }),
      http.get("*/v1/tasks", () => HttpResponse.json(sessionRequired, { status: 401 }))
    )
    // El cliente solo consulta la sesión mientras hay un componente que la usa.
    const { unmount } = renderHook(() => authClient.useSession())
    await settle()
    const before = sessionRequests

    await createQueryClient()
      .fetchQuery({ queryKey: ["tasks"], queryFn: () => apiClient.get("/tasks") })
      .catch(() => {})

    await waitFor(() => expect(sessionRequests).toBeGreaterThan(before))
    unmount()
  })

  it("no vuelve a consultar la sesión ante otros errores", async () => {
    let sessionRequests = 0
    server.use(
      http.get("*/v1/auth/get-session", () => {
        sessionRequests++
        return HttpResponse.json(null)
      }),
      http.get("*/v1/tasks", () => HttpResponse.json({}, { status: 404 }))
    )
    const { unmount } = renderHook(() => authClient.useSession())
    await settle()
    const before = sessionRequests

    await createQueryClient()
      .fetchQuery({ queryKey: ["tasks"], queryFn: () => apiClient.get("/tasks") })
      .catch(() => {})
    await settle()

    expect(sessionRequests).toBe(before)
    unmount()
  })

  it("no reintenta un error 4xx", async () => {
    let calls = 0
    server.use(
      http.get("*/v1/tasks", () => {
        calls++
        return HttpResponse.json({}, { status: 404 })
      })
    )
    const queryClient = createQueryClient()

    await queryClient.fetchQuery({ queryKey: ["tasks"], queryFn: () => apiClient.get("/tasks") }).catch(() => {})

    expect(calls).toBe(1)
  })
})
