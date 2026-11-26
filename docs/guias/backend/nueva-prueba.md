# Escribir una prueba en el backend

Ejemplos genéricos con `<name>` y `<resource>`, que aplican
[Pruebas](../../arquitectura/08-conceptos-transversales.md#pruebas).

## Prueba unitaria

Vitest expone `describe`, `it`, `expect` y `vi` sin importarlos.

```ts
// src/common/errors/error-response.spec.ts
import { describeHttpError } from "./error-response.js"

describe("describeHttpError", () => {
  it("el estado 404 tiene un código y un mensaje propios", () => {
    expect(describeHttpError(404)).toEqual({ code: "NOT_FOUND", message: "Resource not found" })
  })

  it("el resto de estados usan HTTP_ERROR con el texto estándar del estado", () => {
    expect(describeHttpError(503)).toEqual({ code: "HTTP_ERROR", message: "Service Unavailable" })
  })
})
```

Un middleware se prueba aislado, con una petición y una respuesta simuladas, sin la aplicación completa:

```ts
// src/common/middleware/<name>.middleware.spec.ts
import type { Request, Response } from "express"

import { <name> } from "./<name>.middleware.js"

describe("<name>", () => {
  it("añade la cabecera esperada y continúa", () => {
    const request = {} as Request
    const response = { setHeader: vi.fn() } as unknown as Response
    const next = vi.fn()

    <name>(request, response, next)

    expect(response.setHeader).toHaveBeenCalledWith("<Cabecera>", "<valor>")
    expect(next).toHaveBeenCalledOnce()
  })
})
```

La configuración se prueba con objetos, sin tocar `process.env`; el ejemplo completo está en
[Definir una configuración](./nueva-configuracion.md#probar-la-configuración). La validación global se prueba igual:

```ts
// src/config/env.validation.spec.ts
import { validateEnv } from "./env.validation.js"

describe("validateEnv", () => {
  it("informa de todas las variables inválidas a la vez", () => {
    expect(() => validateEnv({ DATABASE_URL: "no-es-una-url", BETTER_AUTH_SECRET: "corto" })).toThrow(
      /DATABASE_URL[\s\S]*BETTER_AUTH_SECRET/
    )
  })
})
```

Una regla de un servicio que no consulta la base de datos se prueba con `Test.createTestingModule`, sustituyendo las
dependencias con `useValue`:

```ts
// src/modules/<name>/services/<name>.service.spec.ts
import { Test } from "@nestjs/testing"

import { <Dependency>Service } from "./<dependency>.service.js"
import { <Name>Service } from "./<name>.service.js"

describe("<Name>Service", () => {
  const <dependency> = { <method>: vi.fn() }
  let service: <Name>Service

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [<Name>Service, { provide: <Dependency>Service, useValue: <dependency> }],
    }).compile()
    service = moduleRef.get(<Name>Service)
  })

  it("aplica la regla con el valor que devuelve la dependencia", () => {
    <dependency>.<method>.mockReturnValue(<valor>)

    expect(service.<rule>(<entrada>)).toBe(<resultado>)
  })
})
```

## Prueba de integración

`createTestApp` arranca la aplicación y `createClient` la llama con Supertest, con las URL relativas a `apiBasePath`.

```ts
// test/<name>/<name>.e2e-spec.ts
import type { NestExpressApplication } from "@nestjs/platform-express"
import { errorResponseSchema } from "@autana/contracts/errors"

import { createTestApp } from "../support/test-app.js"
import { createClient } from "../support/test-client.js"

describe("GET /<resource>", () => {
  let app: NestExpressApplication
  let client: ReturnType<typeof createClient>

  beforeAll(async () => {
    app = await createTestApp()
    client = createClient(app)
  })

  afterAll(() => app.close())

  it("responde con el contrato público", async () => {
    const response = await client.request("/<resource>")

    expect(response.status).toBe(200)
    expect(response.headers["x-request-id"]).toBeTruthy()
  })

  it("un recurso inexistente responde 404 con el contrato de error", async () => {
    const response = await client.request("/<resource>/no-existe")
    const body = errorResponseSchema.parse(response.body)

    expect(response.status).toBe(404)
    expect(body.requestId).toBe(response.headers["x-request-id"])
  })
})
```

Para una ruta que exige sesión, `signUp` registra un usuario con el prefijo de correo del archivo y devuelve su cookie,
y `deleteUsers` elimina los usuarios del prefijo al terminar:

```ts
const emailPrefix = "e2e-<name>-"

afterEach(() => client.deleteUsers(emailPrefix))

it("lista los recursos del usuario", async () => {
  const { cookie } = await client.signUp(emailPrefix)

  const response = await client.request("/<resource>", { cookie })

  expect(response.status).toBe(200)
})
```

Para el comportamiento que cambia con `NODE_ENV` u otra variable, `createTestApp({ env })` arranca la aplicación con ese
entorno, y la prueba lo restaura al terminar:

```ts
// test/common/production.e2e-spec.ts
afterEach(async () => {
  vi.unstubAllEnvs()
  await app.close()
})

it("añade una CSP que no permite cargar nada", async () => {
  app = await createTestApp({ env: { NODE_ENV: "production" } })

  const response = await createClient(app).request("/health")

  expect(response.headers["content-security-policy"]).toBe("default-src 'none';frame-ancestors 'none'")
})
```

Para provocar un error que la API no produce, pasa un controlador de prueba a `createTestApp({ controllers })`.

## Ejecutarlas

- `npm run test:unit -w api` ejecuta solo las unitarias y no necesita PostgreSQL.
- `npm run test:e2e -w api` ejecuta solo las de integración y prepara la base `<base>_test`.
- `npm test -w api` ejecuta las unitarias y después las de integración, y `npm test` en la raíz, las de todo el
  monorepo.
