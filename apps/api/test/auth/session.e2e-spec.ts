import type { NestExpressApplication } from "@nestjs/platform-express"
import { errorResponseSchema } from "@autana/contracts/errors"
import { session } from "@autana/database/schema/auth"
import { eq } from "drizzle-orm"

import { createTestApp } from "../support/test-app.js"
import { cookieFrom, createClient } from "../support/test-client.js"

const emailPrefix = "e2e-session-"

describe("sesión", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp()
    client = createClient(app)
  })

  afterEach(() => client.deleteUsers(emailPrefix))
  afterAll(() => app.close())

  describe("inicio de sesión con credenciales incorrectas", () => {
    it("una contraseña incorrecta de un usuario existente responde 401 igual que un usuario inexistente", async () => {
      const { email } = await client.signUp(emailPrefix)

      const wrongPassword = await client.request("/auth/sign-in/email", {
        method: "POST",
        body: { email, password: "contraseña-incorrecta" },
      })
      const unknownUser = await client.request("/auth/sign-in/email", {
        method: "POST",
        body: {
          email: `${emailPrefix}nadie@mail.com`,
          password: "contraseña-incorrecta",
        },
      })
      // No se distingue una cuenta existente de una que no existe.
      expect(wrongPassword.status).toBe(401)
      expect(wrongPassword.body).toEqual({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      })
      expect(unknownUser.status).toBe(401)
      expect(unknownUser.body).toEqual(wrongPassword.body)
      expect(wrongPassword.headers["set-cookie"]).toBeUndefined()
    })

    it("no crea una sesión nueva", async () => {
      const { id, email } = await client.signUp(emailPrefix)

      await client.request("/auth/sign-in/email", {
        method: "POST",
        body: { email, password: "contraseña-incorrecta" },
      })

      expect(await client.db.select().from(session).where(eq(session.userId, id))).toHaveLength(1)
    })
  })

  describe("cierre de sesión", () => {
    it("invalida la cookie: las rutas protegidas dejan de responder y la sesión desaparece", async () => {
      const { id, cookie } = await client.signUp(emailPrefix)
      expect((await client.request("/health", { cookie })).status).toBe(200)

      const signOut = await client.request("/auth/sign-out", {
        method: "POST",
        cookie,
        body: {},
      })

      expect(signOut.status).toBe(200)
      expect((await client.request("/health", { cookie })).status).toBe(401)
      expect(JSON.parse((await client.request("/auth/get-session", { cookie })).text)).toBeNull()
      expect(await client.db.select().from(session).where(eq(session.userId, id))).toHaveLength(0)
    })

    it("solo cierra la sesión de la cookie, no las demás del mismo usuario", async () => {
      const { email, cookie } = await client.signUp(emailPrefix)
      const signIn = await client.request("/auth/sign-in/email", {
        method: "POST",
        body: { email, password: "12345678" },
      })
      const otherCookie = cookieFrom(signIn)

      await client.request("/auth/sign-out", {
        method: "POST",
        cookie,
        body: {},
      })

      expect((await client.request("/health", { cookie })).status).toBe(401)
      expect((await client.request("/health", { cookie: otherCookie })).status).toBe(200)
    })
  })

  describe("expiración de la sesión", () => {
    it("una sesión caducada responde 401 en las rutas protegidas y no se devuelve como sesión", async () => {
      const { id, cookie } = await client.signUp(emailPrefix)
      expect((await client.request("/health", { cookie })).status).toBe(200)

      await client.db
        .update(session)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(session.userId, id))

      const protectedRoute = await client.request("/health", { cookie })
      expect(protectedRoute.status).toBe(401)
      expect(errorResponseSchema.parse(protectedRoute.body).code).toBe("SESSION_REQUIRED")
      expect(JSON.parse((await client.request("/auth/get-session", { cookie })).text)).toBeNull()
    })
  })

  describe("cuerpos JSON mal formados", () => {
    it.each(["/auth/sign-in/email", "/auth/sign-up/email"])(
      "%s responde 400 con el code de Better Auth",
      async (path) => {
        const response = await client.request(path, {
          method: "POST",
          rawBody: "{no es json",
        })

        expect(response.status).toBe(400)
        expect(response.body.code).toBe("BAD_REQUEST")
        expect(response.headers["x-request-id"]).toBeTruthy()
      }
    )
  })
})
