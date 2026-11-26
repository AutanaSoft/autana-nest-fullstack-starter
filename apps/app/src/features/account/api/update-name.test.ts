import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { updateName } from "./update-name"

describe("updateName", () => {
  it("envía el nombre a Better Auth", async () => {
    let body: unknown
    server.use(
      http.post("*/v1/auth/update-user", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ status: true })
      })
    )

    await updateName("Luisa Gómez")

    expect(body).toEqual({ name: "Luisa Gómez" })
  })

  it("lanza cuando la API rechaza el nombre", async () => {
    server.use(
      http.post("*/v1/auth/update-user", () =>
        HttpResponse.json({ code: "INVALID_NAME", message: "Invalid name" }, { status: 400 })
      )
    )

    await expect(updateName("Ana2")).rejects.toThrow("No se pudo guardar el nombre.")
  })
})
