# Definir una configuración en el backend

Ejemplo genérico de una configuración `<name>`, que ilustra las reglas de
[Configuración y entornos](../../arquitectura/08-conceptos-transversales.md#configuración-y-entornos). Las
implementaciones de referencia incluidas en la plantilla están en `apps/api/src/config/`.

## Archivo de configuración

Cada dominio que necesite configuración (la base de datos, la autenticación, CORS, las cabeceras de seguridad, el límite
de peticiones, etc.) tiene su archivo. Reúne en un solo lugar el esquema de sus variables de entorno, la función que
construye la configuración y su registro en `ConfigModule`.

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

- Las variables de entorno conservan su nombre (`UPPER_SNAKE_CASE`) y las propias van en `camelCase`, de modo que al
  leer `config.<NAME>_URL` o `config.maxRetries` se distingue de dónde viene cada valor.
- El esquema solo declara variables que se leen del entorno. Los valores derivados o constantes se calculan en `build`.
- `build` recibe el entorno como parámetro y no lee `process.env`. Solo `registerAs` se lo pasa.

## Registrar la configuración

Añade la configuración a la lista de `src/config/index.ts`, que `ConfigModule` carga con `load`, y el `shape` de su
esquema a `src/config/env.validation.ts`.

```ts
// src/config/index.ts
export const configurations = [appConfig, databaseConfig, authConfig, <name>Config]
```

```ts
// src/config/env.validation.ts
const envSchema = z.object({
  ...appEnvSchema.shape,
  ...databaseEnvSchema.shape,
  ...authEnvSchema.shape,
  ...(<name>EnvSchema.shape),
})
```

`validateEnv` valida todo el entorno con un único `safeParse` al arrancar, así que informa de todas las variables
inválidas a la vez. Una variable que lee más de un dominio se declara en cada uno; la advertencia está en
[Reglas](#reglas).

## Usar la configuración

Inyecta la configuración con su clave y tipa el parámetro con el tipo del dominio. No leas `process.env` fuera de
`registerAs`.

```ts
// src/<name>/<name>.service.ts
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

`build` se prueba con objetos, sin tocar `process.env`. Un caso por regla: valores por defecto, coerciones, variables
inválidas y valores propios.

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

## Reglas

- Una configuración por dominio, en `src/config/<name>.config.ts`.
- Cada configuración declara las variables de entorno que lee, aunque otro dominio también las lea (como `WEB_ORIGIN`,
  que usan CORS, CSRF y la autenticación). Al unirse los esquemas, `validateEnv` se queda con la última declaración de
  una clave repetida, por lo que las declaraciones deben ser idénticas.
- Dos pruebas de `env.validation.spec.ts` protegen esa regla: una exige que una variable repetida se comporte igual en
  todos los dominios (incluido su valor por defecto) y otra que las variables declaradas coincidan con las del
  `.env.example`, lo que detecta un nombre mal escrito. `NODE_ENV` queda fuera de la segunda porque lo define el
  despliegue.
- Una variable nueva se documenta también en el `.env.example` de `apps/api` y en
  [Configuración](../general/configuracion.md).
- Exporta un solo tipo por configuración, derivado de `build` con `ReturnType`.
- En producción no existe `.env`: el despliegue define las variables, y `validateEnv` detiene el arranque si falta
  alguna.
