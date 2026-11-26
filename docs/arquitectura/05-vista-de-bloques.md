# Vista de bloques de construcción

## Backend

### Estructura de `apps/api`

`<name>` representa el nombre de un módulo.

```text
apps/api/
├── nest-cli.json
├── tsconfig.json
├── vitest.config.ts
├── vitest.config.e2e.ts
├── test/
│   ├── support/
│   └── <name>/
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── app.setup.ts
    ├── config/
    │   ├── <name>.config.ts
    │   ├── env.validation.ts
    │   └── index.ts
    ├── database/
    │   ├── database.module.ts
    │   └── database.ts
    ├── common/
    │   ├── decorators/
    │   ├── errors/
    │   ├── filters/
    │   ├── middleware/
    │   ├── modules/
    │   ├── openapi/
    │   └── pipes/
    └── modules/
        └── <name>/
            ├── <name>.module.ts
            ├── <name>.controller.ts
            ├── services/
            ├── repositories/
            ├── mappers/
            ├── guards/
            ├── decorators/
            ├── middleware/
            ├── pipes/
            └── filters/
```

- `src/main.ts` crea la aplicación con `bodyParser: false` (`AuthModule` registra los parsers de cuerpo fuera de las
  rutas de autenticación), aplica `configureApp` y escucha en `PORT`.
- `src/app.module.ts` es el módulo raíz. Importa la configuración, la base de datos y los módulos, y registra el filtro
  de excepciones, el interceptor de serialización y, en producción, el límite de peticiones.
- `src/app.setup.ts` reúne la configuración que no es un módulo: los middlewares globales (identificador de la petición,
  registro, cabeceras de seguridad, CORS, compresión y CSRF), el prefijo global y la documentación OpenAPI. Está
  separado de `main.ts` para que las pruebas arranquen la misma aplicación.
- `src/config/` tiene un archivo por dominio (`<name>.config.ts`), la validación del entorno (`env.validation.ts`) y la
  lista de configuraciones que carga `ConfigModule` (`index.ts`). El patrón está en
  [Configuración y entornos](./08-conceptos-transversales.md#configuración-y-entornos).
- `src/database/` registra el cliente de Drizzle con `@nestjs/drizzle` (`database.module.ts`) y exporta el tipo que se
  inyecta (`database.ts`). Usa el paquete `database`.
- `src/common/` contiene lo transversal que usan varios módulos. No tiene archivos sueltos: cada pieza vive en la
  carpeta de su tipo de Nest.
  - `decorators/`: el decorador de respuesta (`@ResponseSchema`).
  - `errors/`: la construcción de los errores públicos (`createErrorResponse`).
  - `filters/`: el filtro de excepciones.
  - `middleware/`: el identificador de la petición, el registro y las cabeceras `no-store`.
  - `modules/`: el módulo del límite de peticiones (`RateLimitModule`), que configura `@nestjs/throttler` y no pertenece
    a ninguna funcionalidad. No es `src/modules/`, que reúne los módulos de funcionalidad.
  - `openapi/`: el registro de los esquemas de OpenAPI.
  - `pipes/`: el pipe de validación del contrato.
- `src/modules/<name>/` contiene un módulo de Nest por funcionalidad. `src/modules/auth/` registra la integración con
  Better Auth (`auth.module.ts`), su configuración (`auth.ts`) y el hook que valida el usuario
  (`user-validation.hook.ts`); se describe en
  [Autenticación y autorización](./08-conceptos-transversales.md#autenticación-y-autorización). `src/modules/health/`
  expone las comprobaciones de salud con `@nestjs/terminus` y su indicador propio de la base de datos (`indicators/`);
  se describe en [Salud de la API](./08-conceptos-transversales.md#salud-de-la-api). Son los dos únicos módulos de la
  base.
- `test/<name>/` contiene las pruebas de integración de cada módulo, y `test/support/`, lo que comparten (la aplicación
  de prueba, el cliente y la preparación de la base). Las pruebas unitarias viven junto al archivo que prueban
  (`<archivo>.spec.ts`). Los niveles están en [Pruebas](./08-conceptos-transversales.md#pruebas).

#### Reglas de dependencia

- `app.module.ts` y `app.setup.ts` ensamblan la aplicación y no contienen lógica de negocio.
- Un módulo importa de `common/`, `config/`, `database/` y de los paquetes `contracts` y `database`. Estos no importan
  de los módulos.
- Los módulos no se importan entre sí. La excepción es `auth`, que ofrece al resto el guard de sesión y sus decoradores.
  Lo que dos módulos necesitan en común sube a `common/` o, si lo consume el frontend, al paquete `contracts`.
- Una pieza pasa de un módulo a la carpeta de su tipo en `common/` cuando la reutiliza otro módulo.

#### Anatomía de un módulo

`<name>.module.ts` y `<name>.controller.ts` están siempre en la raíz del módulo. El resto de las piezas se agrupa por
tipo de Nest, con los mismos nombres de carpeta que en `common/`. Una carpeta se crea cuando existe su primera pieza: un
módulo que solo tiene módulo y controlador no lleva ninguna.

- `<name>.module.ts` declara el controlador, los servicios y los repositorios, y registra los middlewares del módulo con
  `configure(consumer)`.
- `<name>.controller.ts` solo se ocupa de HTTP: valida los parámetros con su esquema (`@Body({ schema })`, `@Param`,
  `@Query`), fija los códigos de estado, llama a los servicios y declara el esquema de la respuesta con
  `@ResponseSchema`.
- `services/<name>.service.ts` contiene las reglas y las consultas de un concepto de dominio, sin conocer HTTP
  ([Responsabilidad de los servicios](./08-conceptos-transversales.md#responsabilidad-de-los-servicios)).
- `repositories/<name>.repository.ts` encapsula una consulta compleja o reutilizada por varios servicios.
- `mappers/to-<entity>.ts` adapta una fila de la base de datos al tipo del contrato
  ([Serialización](./08-conceptos-transversales.md#serialización-de-respuestas-con-zod)).
- `guards/`, `decorators/`, `middleware/`, `pipes/` y `filters/` contienen las piezas de Nest que solo usa el módulo.
- `indicators/<name>.health.ts` contiene un indicador de salud de Terminus propio, como el de la base de datos en
  `health`.

| Elemento           | Convención                             | Ejemplo                     |
| ------------------ | -------------------------------------- | --------------------------- |
| Carpeta del módulo | minúsculas, nombre del recurso         | `products`                  |
| Archivo            | `<name>.<tipo>.ts` en kebab-case       | `products.controller.ts`    |
| Servicio adicional | `services/<name>-<concern>.service.ts` | `products-stats.service.ts` |
| Mapper             | `mappers/to-<entity>.ts`               | `mappers/to-product.ts`     |

### Estructura de `packages/contracts`

```text
packages/contracts/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── api.ts
    ├── <name>.ts
    └── <name>.test.ts
```

- `src/api.ts` exporta `apiBasePath`, el prefijo común de la API.
- `src/<name>.ts` contiene los esquemas Zod de peticiones y respuestas de un módulo, junto con los tipos que se infieren
  de ellos. Se importa como `@autana/contracts/<name>`.
- `src/<name>.test.ts` prueba los esquemas de `<name>.ts` y vive junto a ellos.
- El paquete se distribuye como fuente TypeScript, sin compilar: `exports` apunta a `./src/*.ts`. `zod` es una
  dependencia de pares para que el backend y el frontend compartan una sola instancia.
- El backend lo ejecuta con Node.js, que quita los tipos, por lo que los imports relativos entre sus archivos llevan la
  extensión `.ts`. El frontend lo resuelve con `paths` en `tsconfig.app.json` y con Vite.

### Estructura de `packages/database`

```text
packages/database/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── vitest.config.ts
├── .env.example
├── migrations/
├── test/
└── src/
    ├── client.ts
    ├── migrate.ts
    ├── reset.ts
    ├── scripts/
    │   └── reset.ts
    └── schema/
        └── <name>.ts
```

- `src/schema/<name>.ts` define las tablas, y `migrations/` contiene las migraciones versionadas de Drizzle Kit.
- `src/client.ts` exporta `createDatabase(url)`, que crea el pool de PostgreSQL y el cliente de Drizzle. El paquete no
  lee variables de entorno ni depende de la API: la URL llega por parámetro.
- `src/migrate.ts` exporta `migrateDatabase(url)`, que aplica las migraciones pendientes a la base indicada.
- `src/reset.ts` exporta `resetDatabase(url)` y `src/scripts/reset.ts` es el comando que lo ejecuta con confirmación
  ([Datos](./08-conceptos-transversales.md#datos)).
- `drizzle.config.ts` configura Drizzle Kit y carga el `.env` del paquete, que solo define `DATABASE_URL`.
- Se distribuye como fuente TypeScript, igual que `contracts`.

## Frontend

### Estructura de carpetas

`<name>` representa el nombre de la funcionalidad.

```text
src/
├── main.tsx
├── app/
│   ├── router.tsx
│   ├── providers.tsx
│   ├── layouts/
│   │   └── root-layout.tsx
│   └── pages/
│       ├── error-page.tsx
│       ├── loading-page.tsx
│       └── not-found-page.tsx
├── features/
│   └── <name>/
│       ├── routes.tsx
│       ├── layouts/
│       ├── pages/
│       ├── components/
│       ├── api/
│       ├── hooks/
│       └── schemas/
├── components/
│   └── common/
├── hooks/
├── lib/
└── test/
```

Junto a `src/`, `apps/app` contiene `vitest.config.ts`. `src/test/` reúne lo compartido por las pruebas de Vitest: el
servidor de MSW, su preparación y los auxiliares.

Crea en cada funcionalidad solo las carpetas que use:

- Las subcarpetas de `components/` se crean según la necesidad y se nombran por su contenido: `forms/`, `dialogs/`,
  `lists/`, `filters/`, `menus/`.
- `api/errors.ts` existe únicamente cuando varias peticiones interpretan sus errores del mismo modo.
- Cuando una funcionalidad tiene muchos endpoints, `api/` se subdivide por recurso (por ejemplo, `api/comments/`).

#### Responsabilidad de cada pieza

- **`app/router.tsx`:** crea el router y ensambla las rutas de cada funcionalidad bajo `RootLayout`.
- **`app/layouts/root-layout.tsx`:** layout raíz. Renderiza `<Outlet />` y lleva el `ErrorBoundary` de toda la
  aplicación.
- **`app/pages/`:** páginas globales: error inesperado, ruta no encontrada y estado de carga inicial (`HydrateFallback`)
  mientras se descarga el código diferido de la primera ruta.
- **`app/providers.tsx`:** monta los proveedores globales, como el cliente de consultas.
- **`features/panel/`:** contenedor de las pantallas privadas. Su layout aplica la guarda de sesión y muestra la barra
  lateral y la cabecera. No es un recurso: como una funcionalidad no importa de otra, `app/router.tsx` lo compone con
  las rutas de las funcionalidades privadas mediante `createPanelRoutes([...])`. Cada ruta declara su título en `handle`
  y la cabecera lo lee.
- **`routes.tsx`:** exporta la ruta de la funcionalidad: su layout y las páginas hijas.
- **`layouts/`:** estructura compartida por las páginas de la funcionalidad. Las pantallas privadas no llevan layout
  propio: se montan bajo el de `features/panel`.
- **`pages/`:** conectan la ruta con los datos. Llaman a los hooks, definen las acciones de negocio y componen los
  componentes de la página.
- **`components/`:** piezas de interfaz de la funcionalidad. Pueden gestionar su estado local, como un formulario.
- **`api/`:** cada archivo realiza una petición con el cliente HTTP, valida la respuesta con el esquema del contrato e
  interpreta los errores propios de esa petición.
- **`hooks/` de la feature:** envuelven las funciones de `api/` con la librería de consultas. Definen la clave de caché,
  la invalidación y las opciones. Un hook de filtros lee y escribe en la URL los filtros y la página.
- **`schemas/`:** esquemas de validación propios de la funcionalidad, como los de sus formularios. Cada esquema vive en
  su propio archivo. Los contratos de la API se importan del paquete de contratos del monorepo.
- **`components/common/`:** componentes propios reutilizados entre funcionalidades.
- **`hooks/` y `lib/`:** hooks y utilidades compartidos entre funcionalidades, como el cliente HTTP y el cliente de
  autenticación.

### Reglas de dependencia

1. Una funcionalidad no importa código de otra. Si dos funcionalidades necesitan lo mismo, ese código sube a
   `components/`, `hooks/` o `lib/`.
2. `app/` puede importar de cualquier funcionalidad. Ninguna funcionalidad importa de `app/`.
3. `components/`, `hooks/` y `lib/` no importan de las funcionalidades.
4. Los hooks no importan el cliente HTTP. Llaman a las funciones de `api/`.
5. Las funciones de `api/` no usan React ni la librería de consultas. La única excepción es el cliente de autenticación
   (`lib/auth-client.ts`), que se importa de `better-auth/react` porque los layouts también lo usan para leer la sesión
   con `useSession`.
6. No se usan archivos `index.ts` que reexporten módulos. Cada import apunta directamente al archivo que define lo
   importado.
7. Los layouts no consultan los datos de una página. Esa responsabilidad corresponde a la página. El layout del panel sí
   comprueba la sesión para proteger las pantallas privadas.

Estas reglas se comprueban en la revisión de código, no con lint ([Riesgos](./11-riesgos-y-deuda-tecnica.md#riesgos)).

### Ejemplo de una funcionalidad

Consulta la guía [Crear una funcionalidad en el frontend](../guias/frontend/nueva-funcionalidad/README.md). La base del
frontend es `auth` y `panel`. La plantilla incluye además dos páginas de ejemplo sin tablas ni endpoints propios:
`status`, la página de inicio del panel, que muestra la salud de la API, y `account`, con los datos de la sesión y el
cambio de nombre. Se sustituyen según
[Sustituir las páginas de ejemplo](../guias/general/sustituir-paginas-de-ejemplo.md).
