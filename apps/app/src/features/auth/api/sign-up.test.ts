import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { signUp } from "./sign-up"

const values = { name: "Ana Ruiz", email: "ana@mail.com", password: "12345678" }
const genericMessage = "No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo."

describe("signUp", () => {
  it("resuelve cuando la API crea la cuenta", async () => {
    server.use(http.post("*/v1/auth/sign-up/email", () => HttpResponse.json({ token: "t", user: { id: "1" } })))

    await expect(signUp(values)).resolves.toBeUndefined()
  })

  it("no revela si el correo ya está registrado", async () => {
    server.use(
      http.post("*/v1/auth/sign-up/email", () =>
        HttpResponse.json({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" }, { status: 422 })
      )
    )

    await expect(signUp(values)).rejects.toThrow(genericMessage)
  })

  it("usa el mismo mensaje para cualquier otro error", async () => {
    server.use(http.post("*/v1/auth/sign-up/email", () => HttpResponse.json({ code: "INVALID_NAME" }, { status: 400 })))

    await expect(signUp(values)).rejects.toThrow(genericMessage)
  })

  it("usa el mismo mensaje si falla la red", async () => {
    server.use(http.post("*/v1/auth/sign-up/email", () => HttpResponse.error()))

    await expect(signUp(values)).rejects.toThrow(genericMessage)
  })
})
