# Regenerar y comparar el esquema de Better Auth

`packages/database/src/schema/auth.ts` lo genera la CLI de Better Auth y lleva dos personalizaciones, descritas en
[Datos](../../arquitectura/08-conceptos-transversales.md#datos). Esta guía explica cómo regenerarlo en un archivo
temporal y compararlo con el actual, por ejemplo al añadir un plugin o al actualizar Better Auth. La comparación solo
debe mostrar esas dos personalizaciones y los cambios nuevos que haya que incorporar.

## Regenerar en un archivo temporal

1. Crea `apps/api/auth.cli.config.ts`, que exporta `auth` con las opciones de `createAuth` que afectan al esquema: el
   adaptador, los plugins y `advanced.database.generateId`. No hace falta una base de datos real. No lo versiones.

   ```ts
   import { drizzleAdapter } from "@better-auth/drizzle-adapter"
   import { betterAuth } from "better-auth"
   import { admin } from "better-auth/plugins"

   export const auth = betterAuth({
     baseURL: "http://localhost:3000",
     secret: "x".repeat(40),
     database: drizzleAdapter({} as never, { provider: "pg", transaction: true }),
     emailAndPassword: { enabled: true },
     advanced: { database: { generateId: "uuid", joins: true } },
     plugins: [admin()],
   })
   ```

2. Genera el esquema en `apps/api/schema.generated.ts`, dentro del repositorio para que Prettier use su configuración.
   Usa la misma versión de la CLI que la de `better-auth` y desactiva la telemetría:

   ```bash
   cd apps/api
   BETTER_AUTH_TELEMETRY=0 npx auth@<versión de better-auth> generate \
     --config ./auth.cli.config.ts --output ./schema.generated.ts -y
   npx prettier --write schema.generated.ts
   ```

## Comparar y aplicar

Compara el resultado con el esquema actual:

```bash
diff schema.generated.ts ../../packages/database/src/schema/auth.ts
```

Las diferencias esperadas son el comentario de cabecera, `{ withTimezone: true }` en cada columna de fecha y
`defaultNow()` en `updated_at` de `session` y `account`. Cualquier otra diferencia es un cambio de Better Auth o de un
plugin: incorpórala a `auth.ts` conservando esas dos personalizaciones.

Después borra `auth.cli.config.ts` y `schema.generated.ts`, y regenera la migración como explican los
[comandos](../general/comandos.md).
