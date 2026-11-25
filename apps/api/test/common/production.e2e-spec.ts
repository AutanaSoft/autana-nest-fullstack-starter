import type { NestExpressApplication } from "@nestjs/platform-express"
import { errorResponseSchema } from "@autana/contracts/errors"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

// Comprueba que la aplicación conecta, con NODE_ENV=production, lo que en desarrollo no se activa o cambia. La CSRF, CORS
// y los errores ya se prueban en sus propios archivos.
describe("la aplicación con NODE_ENV=production", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  async function start(trustProxy = false, extraEnv: Record<string, string> = {}) {
    app = await createTestApp({
      env: { NODE_ENV: "production", TRUST_PROXY: String(trustProxy), ...extraEnv },
    })
    client = createClient(app)
  }

  afterEach(async () => {
    vi.unstubAllEnvs()
    await app.close()
  })

  it("añade una CSP que no permite cargar nada", async () => {
    await start()

    const response = await client.request("/health")

    expect(response.headers["content-security-policy"]).toBe("default-src 'none';frame-ancestors 'none'")
  })

  it("limita las peticiones y responde 429 con el contrato de error", async () => {
    await start()
    for (let i = 0; i < 100; i++) expect((await client.request("/health")).status).toBe(200)

    const response = await client.request("/health")

    expect(response.status).toBe(429)
    expect(response.headers["retry-after"]).toBe("60")
    expect(errorResponseSchema.parse(response.body)).toMatchObject({
      code: "RATE_LIMITED",
      statusCode: 429,
    })
  })

  it("limita antes de comprobar la sesión: una ruta protegida sin sesión responde 429, no 401", async () => {
    await start()
    for (let i = 0; i < 100; i++) expect((await client.request("/tasks")).status).toBe(401)

    expect((await client.request("/tasks")).status).toBe(429)
  })

  it("aplica un límite más estricto a las escrituras", async () => {
    await start()
    const write = () => client.request("/tasks", { method: "POST", body: {} })

    for (let i = 0; i < 20; i++) expect((await write()).status).not.toBe(429)

    expect((await write()).status).toBe(429)
    expect((await client.request("/health")).status).toBe(200)
  })

  describe("dirección del cliente", () => {
    // La dirección no se exporta: se comprueba a través de quién comparte contador.
    const get = (forwardedFor: string) =>
      client.request("/health", {
        headers: { "X-Forwarded-For": forwardedFor },
      })

    async function fillCounter() {
      for (let i = 0; i < 100; i++) expect((await get(`1.1.1.${i}, 9.9.9.9`)).status).toBe(200)
    }

    it("con un proxy de confianza usa la última dirección de X-Forwarded-For", async () => {
      await start(true)
      await fillCounter()

      // Otra dirección falsificada al inicio, pero la misma que añadió el proxy: comparte contador.
      expect((await get("2.2.2.2, 9.9.9.9")).status).toBe(429)
      expect((await get("1.1.1.1, 8.8.8.8")).status).toBe(200)
    })

    it("sin proxy de confianza ignora X-Forwarded-For", async () => {
      await start(false)
      await fillCounter()

      expect((await get("1.1.1.1, 8.8.8.8")).status).toBe(429)
    })
  })
  describe("Better Auth", () => {
    const emailPrefix = "e2e-production-"
    const signInAttempt = (clientIp: string, forwardedFor: string) =>
      client.request("/auth/sign-in/email", {
        method: "POST",
        body: { email: `${emailPrefix}nadie@mail.com`, password: "12345678" },
        headers: { "CF-Connecting-IP": clientIp, "X-Forwarded-For": forwardedFor },
      })

    afterEach(() => client.deleteUsers(emailPrefix))

    it("con CLIENT_IP_HEADER limita los intentos de acceso por la IP de esa cabecera", async () => {
      await start(false, { CLIENT_IP_HEADER: "CF-Connecting-IP" })
      for (let i = 0; i < 3; i++) expect((await signInAttempt("3.3.3.3", `1.1.1.${i}, 9.9.9.9`)).status).toBe(401)

      expect((await signInAttempt("3.3.3.3", "2.2.2.2, 8.8.8.8")).status).toBe(429)
      expect((await signInAttempt("4.4.4.4", "2.2.2.2, 9.9.9.9")).status).toBe(401)
    })

    it("sin CLIENT_IP_HEADER y con una cadena de proxies, todos los clientes comparten el contador", async () => {
      await start()
      for (let i = 0; i < 3; i++) expect((await signInAttempt(`3.3.3.${i}`, `1.1.1.${i}, 9.9.9.9`)).status).toBe(401)

      expect((await signInAttempt("4.4.4.4", "2.2.2.2, 9.9.9.9")).status).toBe(429)
    })

    it("la cookie de sesión es Secure aunque BETTER_AUTH_URL use http", async () => {
      await start()

      const response = await client.request("/auth/sign-up/email", {
        method: "POST",
        body: { name: "Ana Ruiz", email: `${emailPrefix}${crypto.randomUUID()}@mail.com`, password: "12345678" },
      })

      const [sessionCookie] = response.headers["set-cookie"] as unknown as string[]
      expect(sessionCookie).toMatch(/^__Secure-better-auth\.session_token=/)
      expect(sessionCookie).toMatch(/;\s*Secure/i)
    })
  })
})
