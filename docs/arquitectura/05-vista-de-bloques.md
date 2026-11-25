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

- `src/main.ts` crea la aplicación con `rawBody: true` (la librería de autenticación recibe los bytes originales de la
  petición), aplica `configureApp` y escucha en `PORT`.
- `src/app.module.ts` es el módulo raíz. Importa la configuración, la base de datos y los módulos, y registra el filtro
  de excepciones, el interceptor de serialización y, en producción, el límite de peticiones.
- `src/app.setup.ts` reúne la configuración que no es un módulo: los middlewares globales (identificador de la petición,
  registro, cabeceras de seguridad, CORS, compresión y CSRF), el prefijo global y la documentación OpenAPI. Está
  separado de `main.ts` para que las pruebas arranquen la misma aplicación.
- `src/config/` tiene un archivo por dominio (`<name>.config.ts`) con el esquema de sus variables de entorno y su
  configuración registrada con `registerAs`. `env.validation.ts` valida todas las variables a la vez al arrancar e
  `index.ts` lista las configuraciones que carga `ConfigModule`.
- `src/database/` registra el cliente de Drizzle con `@nestjs/drizzle` (`database.module.ts`) y exporta el tipo que se
  inyecta (`database.ts`). Usa el paquete `database`.
- `src/common/` contiene lo transversal que usan varios módulos. No tiene archivos sueltos: cada pieza vive en la
  carpeta de su tipo de Nest.
  - `decorators/`: el decorador de respuesta (`@ResponseSchema`).
  - `errors/`: la construcción de los errores públicos (`createErrorResponse`).
  - `filters/`: el filtro de excepciones.
  - `middleware/`: el identificador de la petición, el registro y las cabeceras `no-store`.
  - `openapi/`: el registro de los esquemas de OpenAPI.
  - `pipes/`: el pipe de validación del contrato.
- `src/modules/<name>/` contiene un módulo de Nest por funcionalidad. El módulo `auth` también aloja el guard de sesión
  global y los decoradores `@Public()` y `@CurrentUserId()`.
- `test/<name>/` contiene las pruebas de integración de cada módulo, y `test/support/`, la preparación de la base de
  pruebas. Las pruebas unitarias viven junto al archivo que prueban (`<archivo>.spec.ts`). Los niveles y su criterio
  están en [Pruebas](./08-conceptos-transversales.md#pruebas).

#### Reglas de dependencia

- `app.module.ts` y `app.setup.ts` ensamblan la aplicación y no contienen lógica de negocio.
- Un módulo importa de `common/`, `config/`, `database/` y de los paquetes `contracts` y `database`. Estos no importan
  de los módulos.
- Los módulos no se importan entre sí. La excepción es `auth`, que ofrece al resto el guard de sesión y sus decoradores.
  Lo que dos módulos necesitan en común sube a `common/` o, si lo consume el frontend, al paquete `contracts`.
- Una pieza pasa de un módulo a la carpeta de su tipo en `common/` cuando la reutiliza otro módulo.
- Los imports relativos terminan en `.js`: los paquetes de Nest son solo ESM y el proyecto también.

#### Anatomía de un módulo

`<name>.module.ts` y `<name>.controller.ts` están siempre en la raíz del módulo. El resto de las piezas se agrupa por
tipo de Nest, con los mismos nombres de carpeta que en `common/`. Una carpeta se crea cuando existe su primera pieza: un
módulo que solo tiene módulo y controlador, como `health`, no lleva ninguna.

- `<name>.module.ts` declara el controlador, los servicios y los repositorios, y registra los middlewares del módulo con
  `configure(consumer)`.
- `<name>.controller.ts` solo se ocupa de HTTP: valida los parámetros con su esquema (`@Body({ schema })`, `@Param`,
  `@Query`), fija los códigos de estado, llama a los servicios y declara el esquema de la respuesta con
  `@ResponseSchema`.
- `services/<name>.service.ts` contiene las reglas y las consultas de un concepto de dominio. Lanza excepciones de Nest
  con el código público del error y no conoce HTTP.
- `repositories/<name>.repository.ts` encapsula una consulta compleja o reutilizada por varios servicios.
- `mappers/to-<entity>.ts` adapta una fila de la base de datos al tipo del contrato. Es una función tipada y no valida
  en ejecución lo que recibe de una consulta de Drizzle, porque el tipo ya lo garantiza.
- `guards/`, `decorators/`, `middleware/`, `pipes/` y `filters/` contienen las piezas de Nest que solo usa el módulo.
- Las pruebas unitarias van junto al archivo que prueban (`<archivo>.spec.ts`).

| Elemento           | Convención                             | Ejemplo                  |
| ------------------ | -------------------------------------- | ------------------------ |
| Carpeta del módulo | minúsculas, nombre del recurso         | `tasks`                  |
| Archivo            | `<name>.<tipo>.ts` en kebab-case       | `tasks.controller.ts`    |
| Servicio adicional | `services/<name>-<concern>.service.ts` | `tasks-stats.service.ts` |
| Mapper             | `mappers/to-<entity>.ts`               | `mappers/to-task.ts`     |

`app.setup.ts` aplica el prefijo `apiBasePath` con `setGlobalPrefix`. El prefijo se aplica a la ruta HTTP y al contrato
OpenAPI, y cada controlador declara sus rutas relativas a él (`@Controller('<name>')`).

#### Responsabilidad de los servicios

Cada servicio tiene una única responsabilidad: se ocupa de un concepto de dominio y cambia por una sola razón. Un
servicio que mezcla varios conceptos (un "servicio de dios") crece sin control y obliga a las pruebas a simular muchas
dependencias.

- Un módulo puede tener varios servicios cuando sus responsabilidades son distintas, por ejemplo
  `services/<name>.service.ts` y `services/<name>-stats.service.ts`.
- Conviene dividir un servicio cuando su nombre contiene "y" (`UserAndOrderService`), cuando inyecta dependencias que
  solo usa una parte de sus métodos o cuando sus pruebas necesitan muchos dobles.
- Un caso de uso que coordina varios servicios, como cobrar, guardar y notificar un pedido, no se escribe dentro de
  ninguno de ellos. El controlador llama a cada servicio en orden y no contiene reglas de negocio.
- La lógica sencilla se queda en su servicio: no se fragmenta en servicios o funciones auxiliares sin necesidad.
- Las consultas viven en el servicio, sin una capa de repositorio por defecto. Una consulta se extrae a un repositorio
  del módulo (`repositories/<name>.repository.ts`) solo cuando es compleja o la reutilizan varios servicios.

El ejemplo con código está en la guía [Dividir un servicio por responsabilidad](../guias/backend/nuevo-servicio.md).

#### Inyección de dependencias

Un servicio se inyecta por su clase. Se usa un token (`Symbol` con `@Inject()`) cuando el valor no es una clase, como el
objeto de la librería de autenticación, o cuando hay varias implementaciones reales. Una clase abstracta sirve como
contrato y token a la vez. Para sustituir un servicio en pruebas basta `useValue` o `overrideProvider`, sin crear una
interfaz.

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
- El paquete se distribuye como fuente TypeScript, sin paso de compilación: `exports` apunta a `./src/*.ts`. `zod` es
  una dependencia de pares para que el backend y el frontend compartan una sola instancia.
- Quien lo consume resuelve la fuente de forma distinta. El backend la ejecuta Node.js directamente, quitando los tipos;
  el compilador de la aplicación solo transforma `src/`. El frontend la resuelve con `paths` en `tsconfig.app.json` y
  con el propio Vite.

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
- `src/reset.ts` exporta `resetDatabase(url)`, que deja la base como recién creada, y `src/scripts/reset.ts` es el
  comando que lo ejecuta con confirmación.
- `drizzle.config.ts` configura Drizzle Kit y carga el `.env` del paquete, que solo define `DATABASE_URL`.
- Se distribuye como fuente TypeScript, igual que `contracts`. Node.js la ejecuta quitando los tipos, por lo que los
  imports relativos entre sus archivos llevan la extensión `.ts`.

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
- **`layouts/`:** estructura compartida por las páginas de la funcionalidad. No consulta datos. Las pantallas privadas
  no llevan layout propio: se montan bajo el layout de `features/panel`, que aplica la guarda de sesión.
- **`pages/`:** conectan la ruta con los datos. Llaman a los hooks, definen las acciones de negocio y componen los
  componentes de la página.
- **`components/`:** piezas de interfaz de la funcionalidad. Pueden gestionar su estado local, como un formulario.
- **`api/`:** funciones de TypeScript sin React. Cada archivo realiza una petición con el cliente HTTP, valida la
  respuesta con el esquema del contrato e interpreta los errores propios de esa petición.
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
8. Si un componente existe en el registro de shadcn/ui, se instala con el CLI en lugar de escribirse a mano.
9. `className` se usa para el layout. No se sobrescriben los colores, la tipografía ni los tamaños de un componente: se
   usan sus variantes (`variant`, `size`).
10. Los filtros y la página de una lista viven en la URL, no en el estado de un componente.

> **Verificación.** Estas reglas se comprueban en la revisión de código. La configuración de lint de la plantilla no las
> aplica automáticamente. Si se decide automatizarlas, debe añadirse una regla de restricción de imports por carpeta;
> hasta entonces, el revisor es quien las hace cumplir.

### Ejemplo de una funcionalidad

Consulta la guía [Crear una funcionalidad en el frontend](../guias/frontend/nueva-funcionalidad/README.md). La plantilla
incluye `tasks` y `profile` como funcionalidades de ejemplo, que se retiran según
[Retirar las funcionalidades de ejemplo](../guias/general/retirar-funcionalidades-de-ejemplo.md).
