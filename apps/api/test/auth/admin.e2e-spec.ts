import type { NestExpressApplication } from "@nestjs/platform-express"
import { user } from "@autana/database/schema/auth"
import { eq } from "drizzle-orm"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

const emailPrefix = "e2e-admin-"

describe("plugin admin: rol y baneo", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp()
    client = createClient(app)
  })

  afterEach(() => client.deleteUsers(emailPrefix))
  afterAll(() => app.close())

  const findUser = async (id: string) => (await client.db.select().from(user).where(eq(user.id, id)))[0]

  // No hay primer administrador: el rol se asigna directamente en la base.
  async function signUpAdmin() {
    const admin = await client.signUp(emailPrefix)
    await client.db.update(user).set({ role: "admin" }).where(eq(user.id, admin.id))
    return admin
  }

  const signIn = (email: string) =>
    client.request("/auth/sign-in/email", { method: "POST", body: { email, password: "12345678" } })

  const adminCall = (path: string, cookie: string, body: unknown) =>
    client.request(`/auth/admin${path}`, { method: "POST", cookie, body })

  it("un usuario nuevo tiene el rol user y no está baneado", async () => {
    const { id } = await client.signUp(emailPrefix)

    expect(await findUser(id)).toMatchObject({ role: "user", banned: false, banReason: null, banExpires: null })
  })

  it("un usuario sin el rol admin no puede banear", async () => {
    const regular = await client.signUp(emailPrefix)
    const target = await client.signUp(emailPrefix)

    const response = await adminCall("/ban-user", regular.cookie, { userId: target.id })

    expect(response.status).toBe(403)
    expect((await findUser(target.id)).banned).toBe(false)
  })

  it("un administrador banea: se rechaza el inicio de sesión y se revocan las sesiones", async () => {
    const admin = await signUpAdmin()
    const target = await client.signUp(emailPrefix)
    expect((await client.request("/tasks", { cookie: target.cookie })).status).toBe(200)

    const ban = await adminCall("/ban-user", admin.cookie, { userId: target.id, banReason: "Spam" })
    const attempt = await signIn(target.email)

    expect(ban.status).toBe(200)
    expect(await findUser(target.id)).toMatchObject({ banned: true, banReason: "Spam" })
    expect(attempt.status).toBe(403)
    expect(attempt.body.code).toBe("BANNED_USER")
    expect(attempt.headers["set-cookie"]).toBeUndefined()
    expect((await client.request("/tasks", { cookie: target.cookie })).status).toBe(401)
  })

  it("al levantar el baneo el usuario vuelve a iniciar sesión", async () => {
    const admin = await signUpAdmin()
    const target = await client.signUp(emailPrefix)
    await adminCall("/ban-user", admin.cookie, { userId: target.id })

    const unban = await adminCall("/unban-user", admin.cookie, { userId: target.id })
    const attempt = await signIn(target.email)

    expect(unban.status).toBe(200)
    expect(attempt.status).toBe(200)
    expect((await findUser(target.id)).banned).toBe(false)
  })

  it("un baneo vencido se levanta al iniciar sesión", async () => {
    const target = await client.signUp(emailPrefix)
    await client.db
      .update(user)
      .set({ banned: true, banReason: "Spam", banExpires: new Date(Date.now() - 60_000) })
      .where(eq(user.id, target.id))

    const attempt = await signIn(target.email)

    expect(attempt.status).toBe(200)
    expect(await findUser(target.id)).toMatchObject({ banned: false, banReason: null, banExpires: null })
  })
})
