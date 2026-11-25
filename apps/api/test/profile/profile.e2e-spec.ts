import { Logger } from "@nestjs/common"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { errorResponseSchema } from "@autana/contracts/errors"
import { profileSchema } from "@autana/contracts/profile"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

const emailPrefix = "e2e-profile-"

const fullProfile = {
  phone: "+593 99 123 4567",
  address: "Av. Principal 123, Quito",
  addressReference: "Frente al parque",
  alternateContactName: "Luisa Gómez",
  alternateContactPhone: "0991234567",
}

const emptyProfile = {
  phone: null,
  address: null,
  addressReference: null,
  alternateContactName: null,
  alternateContactPhone: null,
}

describe("perfil", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp()
    client = createClient(app)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await client.deleteUsers(emailPrefix)
  })
  afterAll(() => app.close())

  describe("sin sesión", () => {
    it.each(["GET", "PUT"] as const)("%s /profile responde 401 con no-store", async (method) => {
      const response = await client.request("/profile", {
        method,
        body: method === "PUT" ? fullProfile : undefined,
      })

      expect(response.status).toBe(401)
      expect(errorResponseSchema.parse(response.body).code).toBe("SESSION_REQUIRED")
      expect(response.headers["cache-control"]).toBe("no-store")
    })
  })

  describe("con sesión", () => {
    it("devuelve el perfil vacío mientras no se guarda", async () => {
      const { cookie } = await client.signUp(emailPrefix)

      const response = await client.request("/profile", { cookie })

      expect(response.status).toBe(200)
      expect(response.headers["cache-control"]).toBe("no-store")
      expect(profileSchema.parse(response.body)).toEqual(emptyProfile)
    })

    it("guarda el perfil y lo devuelve en la siguiente lectura", async () => {
      const { cookie } = await client.signUp(emailPrefix)

      const saved = await client.request("/profile", {
        method: "PUT",
        cookie,
        body: fullProfile,
      })
      const read = await client.request("/profile", { cookie })

      expect(saved.status).toBe(200)
      expect(profileSchema.parse(saved.body)).toEqual(fullProfile)
      expect(profileSchema.parse(read.body)).toEqual(fullProfile)
    })

    it("solo devuelve los campos del contrato", async () => {
      const { cookie } = await client.signUp(emailPrefix)

      const saved = await client.request("/profile", {
        method: "PUT",
        cookie,
        body: fullProfile,
      })

      expect(Object.keys(saved.body).toSorted()).toEqual(Object.keys(fullProfile).toSorted())
    })

    it("guardar de nuevo reemplaza el perfil entero", async () => {
      const { cookie } = await client.signUp(emailPrefix)
      await client.request("/profile", {
        method: "PUT",
        cookie,
        body: fullProfile,
      })

      const response = await client.request("/profile", {
        method: "PUT",
        cookie,
        body: { ...emptyProfile, address: "  Otra dirección  " },
      })

      expect(profileSchema.parse(response.body)).toEqual({
        ...emptyProfile,
        address: "Otra dirección",
      })
    })

    it("normaliza los textos vacíos a null", async () => {
      const { cookie } = await client.signUp(emailPrefix)

      const response = await client.request("/profile", {
        method: "PUT",
        cookie,
        body: { ...fullProfile, phone: "", addressReference: "   " },
      })

      expect(profileSchema.parse(response.body)).toMatchObject({
        phone: null,
        addressReference: null,
      })
    })

    it.each([
      { ...emptyProfile, phone: "123" },
      { ...emptyProfile, alternateContactPhone: "abc" },
      { ...emptyProfile, address: "a".repeat(201) },
      { phone: null },
      {},
    ])("rechaza %j con INVALID_PROFILE", async (body) => {
      const { cookie } = await client.signUp(emailPrefix)

      const response = await client.request("/profile", {
        method: "PUT",
        cookie,
        body,
      })

      expect(response.status).toBe(400)
      expect(errorResponseSchema.parse(response.body)).toMatchObject({
        code: "INVALID_PROFILE",
        message: "Invalid profile",
      })
    })

    it("cada usuario ve solo su perfil", async () => {
      const owner = await client.signUp(emailPrefix)
      const other = await client.signUp(emailPrefix)
      await client.request("/profile", {
        method: "PUT",
        cookie: owner.cookie,
        body: fullProfile,
      })

      const read = await client.request("/profile", { cookie: other.cookie })

      expect(profileSchema.parse(read.body)).toEqual(emptyProfile)
    })

    it("no registra los datos personales en el log", async () => {
      const { cookie } = await client.signUp(emailPrefix)
      const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {})

      await client.request("/profile", {
        method: "PUT",
        cookie,
        body: fullProfile,
      })

      const logged = log.mock.calls.flat().join("\n")
      expect(logged).toContain("PUT /v1/profile 200")
      for (const value of Object.values(fullProfile)) expect(logged).not.toContain(value)
    })
  })
})
