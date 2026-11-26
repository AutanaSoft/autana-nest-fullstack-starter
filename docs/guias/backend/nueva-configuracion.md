# Definir una configuración en el backend

Ejemplo genérico de una configuración `<name>`, que aplica
[Configuración y entornos](../../arquitectura/08-conceptos-transversales.md#configuración-y-entornos). Las
implementaciones de referencia están en `apps/api/src/config/`.

## Archivo de configuración

```ts
// src/config/<name>.config.ts
import { registerAs } from "@nestjs/config"
import z from "zod"

// 1. Esquema: solo las variables que se leen del entorno, con su nombre original.
export const <name>EnvSchema = z.object({
  <NAME>_URL: z.url(),
  <NAME>_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
})

// 2. Build: valida con parse y devuelve el entorno validado más los valores propios.
export function build<Name>Config(env: Record<string, unknown>) {
  const parsed = <name>EnvSchema.parse(env)

  return {
    // Variables de entorno: mismo nombre, sin transformar.
    ...parsed,

    // Variables propias: camelCase, derivadas del entorno o constantes de la aplicación.
    <name>Origin: new URL(parsed.<NAME>_URL).origin,
    maxRetries: 3,
  }
}

// 3. Un único tipo, derivado del build: incluye ambos grupos de variables.
export type <Name>Config = ReturnType<typeof build<Name>Config>

// 4. registerAs: namespace de la configuración.
export const <name>Config = registerAs("<name>", () => build<Name>Config(process.env))
```

## Registrar la configuración

Añade la configuración a la lista de `src/config/index.ts` y su esquema a `src/config/env.validation.ts`, en
`envSchemas` y en `envSchema`. Documenta cada variable nueva en `apps/api/.env.example` y en
[Configuración](../general/configuracion.md).

```ts
// src/config/index.ts
export const configurations = [appConfig, databaseConfig, /* ... */ <name>Config]
```

```ts
// src/config/env.validation.ts
export const envSchemas = [appEnvSchema, databaseEnvSchema, /* ... */ <name>EnvSchema]

const envSchema = z.object({
  ...appEnvSchema.shape,
  ...databaseEnvSchema.shape,
  // ...
  ...(<name>EnvSchema.shape),
})
```

## Usar la configuración

Inyecta la configuración con su clave y tipa el parámetro con el tipo del dominio.

```ts
// src/modules/<name>/services/<name>.service.ts
@Injectable()
export class <Name>Service {
  constructor(@Inject(<name>Config.KEY) private readonly config: <Name>Config) {}

  timeout() {
    return this.config.<NAME>_TIMEOUT_MS
  }
}
```

Fuera de la inyección, como en `main.ts`, se obtiene igual: `app.get(<name>Config.KEY)`.

## Probar la configuración

Un caso por regla del esquema: valores por defecto, coerciones, variables inválidas y valores propios.

```ts
// src/config/<name>.config.spec.ts
import { build<Name>Config } from "./<name>.config.js"

const valid = { <NAME>_URL: "https://api.example.com/v1" }

describe("build<Name>Config", () => {
  it("usa el tiempo de espera por defecto", () => {
    expect(build<Name>Config(valid).<NAME>_TIMEOUT_MS).toBe(5000)
  })

  it("deriva el origen de la URL", () => {
    expect(build<Name>Config(valid).<name>Origin).toBe("https://api.example.com")
  })

  it("rechaza una URL inválida", () => {
    expect(() => build<Name>Config({ <NAME>_URL: "no-es-una-url" })).toThrow()
  })
})
```
