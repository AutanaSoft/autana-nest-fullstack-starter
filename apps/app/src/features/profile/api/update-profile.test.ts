import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { fetchProfile } from "./fetch-profile"
import { updateProfile } from "./update-profile"

const profile = {
  phone: "+593991234567",
  address: null,
  addressReference: null,
  alternateContactName: null,
  alternateContactPhone: null,
}

describe("fetchProfile", () => {
  it("devuelve el perfil validado contra el contrato", async () => {
    server.use(http.get("*/v1/profile", () => HttpResponse.json(profile)))

    await expect(fetchProfile(new AbortController().signal)).resolves.toEqual(profile)
  })

  it("rechaza una respuesta que no cumple el contrato", async () => {
    server.use(http.get("*/v1/profile", () => HttpResponse.json({ phone: 1 })))

    await expect(fetchProfile(new AbortController().signal)).rejects.toThrow()
  })
})

describe("updateProfile", () => {
  it("envía los cinco campos con PUT y devuelve el perfil guardado", async () => {
    let body: unknown
    server.use(
      http.put("*/v1/profile", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(profile)
      })
    )

    await expect(updateProfile(profile)).resolves.toEqual(profile)
    expect(body).toEqual(profile)
  })
})
