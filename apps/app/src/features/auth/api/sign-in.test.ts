import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { signIn } from "./sign-in"

const credentials = { email: "ana@mail.com", password: "12345678" }

describe("signIn", () => {
  it("resuelve cuando la API acepta las credenciales", async () => {
    server.use(http.post("*/v1/auth/sign-in/email", () => HttpResponse.json({ token: "t", user: { id: "1" } })))

    await expect(signIn(credentials)).resolves.toBeUndefined()
  })

  it("envía el correo y la contraseña en el cuerpo", async () => {
    let body: unknown
    server.use(
      http.post("*/v1/auth/sign-in/email", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ token: "t", user: { id: "1" } })
      })
    )

    await signIn(credentials)

    expect(body).toMatchObject(credentials)
  })

  it("traduce INVALID_EMAIL_OR_PASSWORD", async () => {
    server.use(
      http.post("*/v1/auth/sign-in/email", () =>
        HttpResponse.json({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }, { status: 401 })
      )
    )

    await expect(signIn(credentials)).rejects.toThrow("Correo o contraseña incorrectos.")
  })

  it("usa un mensaje genérico para cualquier otro error", async () => {
    server.use(
      http.post("*/v1/auth/sign-in/email", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }))
    )

    await expect(signIn(credentials)).rejects.toThrow("No se pudo iniciar sesión. Inténtalo de nuevo.")
  })

  it("usa el mensaje genérico si falla la red", async () => {
    server.use(http.post("*/v1/auth/sign-in/email", () => HttpResponse.error()))

    await expect(signIn(credentials)).rejects.toThrow("No se pudo iniciar sesión. Inténtalo de nuevo.")
  })
})
