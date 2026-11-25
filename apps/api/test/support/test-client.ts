import type { INestApplication } from "@nestjs/common"
import { getDrizzleToken } from "@nestjs/drizzle"
import { apiBasePath } from "@autana/contracts/api"
import { user } from "@autana/database/schema/auth"
import { like } from "drizzle-orm"
import supertest from "supertest"

import type { Database } from "../../src/database/database.js"

export const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS"
  cookie?: string
  body?: unknown
  // Cuerpo JSON enviado tal cual, para probar un JSON mal formado.
  rawBody?: string
  headers?: Record<string, string>
}

// Cookie de sesión que Better Auth deja en una respuesta, lista para reenviarla.
export function cookieFrom(response: { headers: Record<string, unknown> }) {
  const cookies = (response.headers["set-cookie"] ?? []) as string[]
  return cookies.map((value) => value.split(";")[0]).join("; ")
}

// Cliente de una aplicación de pruebas. Envía `Origin` como un navegador, porque la protección CSRF rechaza las
// peticiones que cambian estado desde otro origen.
export function createClient(app: INestApplication) {
  const server = app.getHttpServer()
  const db = app.get<Database>(getDrizzleToken())

  function request(path: string, options: RequestOptions = {}) {
    const { method = "GET", cookie, body, rawBody, headers = {} } = options
    const agent = supertest(server)
    const call = agent[method.toLowerCase() as "get"](`${apiBasePath}${path}`)
    call.set("Origin", webOrigin)
    if (cookie) call.set("Cookie", cookie)
    call.set(headers)
    if (rawBody !== undefined) call.set("Content-Type", "application/json").send(rawBody)
    else if (body !== undefined) call.send(body as object)
    return call
  }

  // Registra un usuario con el flujo real de Better Auth y devuelve su cookie de sesión.
  async function signUp(emailPrefix: string) {
    const email = `${emailPrefix}${crypto.randomUUID()}@mail.com`
    const response = await request("/auth/sign-up/email", {
      method: "POST",
      body: { name: "Ana Ruiz", email, password: "12345678" },
    })
    return {
      id: response.body.user.id as string,
      email,
      cookie: cookieFrom(response),
    }
  }

  // Cada archivo de pruebas usa su propio prefijo de correo para eliminar solo sus usuarios: los archivos se ejecutan en
  // paralelo contra la misma base. El prefijo no debe empezar por el de otro archivo.
  const deleteUsers = (emailPrefix: string) => db.delete(user).where(like(user.email, `${emailPrefix}%`))

  return { db, request, signUp, deleteUsers }
}
