import type { NestExpressApplication } from "@nestjs/platform-express"
import { errorResponseSchema } from "@autana/contracts/errors"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

// Comprueba que la aplicación conecta, con NODE_ENV=production, lo que en desarrollo no se activa o cambia. La CSRF, CORS
// y los errores ya se prueban en sus propios archivos.
describe("la aplicación con NODE_ENV=production", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  async function start(trustProxy = false) {
    app = await createTestApp({
      env: { NODE_ENV: "production", TRUST_PROXY: String(trustProxy) },
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
})
