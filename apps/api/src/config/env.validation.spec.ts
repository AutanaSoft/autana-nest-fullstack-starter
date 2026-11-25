import { readFileSync } from "node:fs"
import path from "node:path"
import type z from "zod"

import { envSchemas, validateEnv } from "./env.validation.js"

const valid = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/autana",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
}

describe("validateEnv", () => {
  it("devuelve el entorno validado con los valores por defecto", () => {
    expect(validateEnv(valid)).toMatchObject({ ...valid, PORT: 3000, TRUST_PROXY: false })
  })

  it("nombra todas las variables inválidas a la vez", () => {
    const invalid = () => validateEnv({ BETTER_AUTH_SECRET: "corto", PORT: "0" })

    for (const name of ["PORT", "DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]) {
      expect(invalid).toThrow(name)
    }
  })
})

describe("esquemas de entorno", () => {
  const declarations = envSchemas.flatMap((schema) => Object.entries(schema.shape))

  // Entradas con las que se comparan las declaraciones repetidas: ausente, vacía, válida e inválida.
  const inputs = [undefined, "", "https://app.example.com", "no-es-una-url", "x".repeat(40)]

  it("una variable declarada en varios dominios se comporta igual en todos", () => {
    const byName = new Map<string, (typeof declarations)[number][1][]>()
    for (const [name, declaration] of declarations) byName.set(name, [...(byName.get(name) ?? []), declaration])

    for (const [name, [first, ...others]] of byName) {
      for (const other of others) {
        for (const input of inputs) {
          expect(summarize(other.safeParse(input)), `${name} con ${JSON.stringify(input)}`).toEqual(
            summarize(first.safeParse(input))
          )
        }
      }
    }
  })

  it("las variables declaradas coinciden con las de .env.example", () => {
    const example = readFileSync(path.join(import.meta.dirname, "../../.env.example"), "utf8")
    const documented = [...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(([, name]) => name)
    // `NODE_ENV` lo define el despliegue o el comando que arranca la aplicación, no el `.env`.
    const declared = new Set(declarations.map(([name]) => name).filter((name) => name !== "NODE_ENV"))

    expect([...declared].sort()).toEqual([...documented].sort())
  })
})

function summarize(result: z.ZodSafeParseResult<unknown>) {
  return result.success
    ? { success: true, data: result.data }
    : { success: false, issues: result.error.issues.map((issue) => `${issue.code}: ${issue.message}`) }
}
