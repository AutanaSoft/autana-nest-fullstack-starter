# Plan: base mínima con estado y cuenta

> Plan de la reducción del código de ejemplo de la plantilla. Parte del
> [PRD de ejemplo](../prd/ejemplo-estado-y-cuenta.md). Sustituye las funcionalidades `tasks` y `profile` por una página
> de estado de la API y una página de cuenta, de modo que la base solo conserve `auth`, `health` y `panel`.

## Objetivo

Dejar una base reutilizable con el mínimo código de ejemplo, fácil de sustituir:

- **Backend:** solo dos módulos funcionales, `auth` (Better Auth) y `health` (Terminus).
- **Frontend:** `auth` (inicio de sesión y registro), `panel` (bloque `dashboard-01` de shadcn), una página de estado
  que muestra la salud de la API y una página de cuenta con los datos del usuario y la edición del nombre.

## Decisiones

- Se añade `@nestjs/terminus` (12.2.0, compatible con `@nestjs/common` 11 y 12).
- Terminus no incluye un indicador para Drizzle: se escribe uno propio con `HealthIndicatorService` que ejecuta
  `SELECT 1`.
- `GET /health/live` y `GET /health/ready` son públicos para el orquestador. `GET /health`, con el detalle de memoria y
  disco, exige sesión y también sirve de ruta protegida en las pruebas e2e.
- Los umbrales de memoria y disco son constantes del módulo, sin configuración por entorno.
- La página de cuenta usa los datos de sesión de Better Auth (`authClient.useSession()` y `authClient.updateUser`) sin
  tablas ni endpoints propios.

## Fases y tareas

Marca cada tarea al completarla. Una fase se da por cerrada cuando cumple sus criterios de aceptación.

### Fase 1. Health con Terminus (API)

- [x] 1.1 Instalar `@nestjs/terminus` en `apps/api`.
- [x] 1.2 Crear el indicador de base de datos en `modules/health/indicators/database.health.ts`.
- [x] 1.3 Reescribir `health.controller.ts` con `GET /health/live`, `GET /health/ready` y `GET /health`.
- [x] 1.4 Registrar `TerminusModule` y el indicador en `health.module.ts`.
- [x] 1.5 Reescribir `packages/contracts/src/health.ts` con el formato de Terminus (`status`, `info`, `error`,
      `details`) y añadir sus pruebas.
- [x] 1.6 Registrar los esquemas de health en `common/openapi/openapi-schemas.ts`.
- [x] 1.7 Reescribir `test/health/health.e2e-spec.ts`.

**Criterios de aceptación**

- `GET /health/live` responde 200 sin sesión y sin consultar dependencias.
- `GET /health/ready` responde 200 sin sesión con la base disponible y 503 cuando la base falla.
- `GET /health` responde 401 sin sesión, 200 con sesión y el detalle de base de datos, memoria y disco, y lleva
  `Cache-Control: no-store`.
- Las respuestas cumplen el contrato Zod y aparecen documentadas en OpenAPI.
- Las pruebas de la fase pasan.

### Fase 2. Retirar `tasks` y `profile` (API, contratos y base de datos)

- [x] 2.1 Borrar `apps/api/src/modules/tasks/` y `apps/api/src/modules/profile/`, y quitarlos de `app.module.ts`.
- [x] 2.2 Quitar sus esquemas de `openapi-schemas.ts`.
- [x] 2.3 Borrar `test/tasks/`, `test/profile/` y `test/database/app-schema.e2e-spec.ts`, y ajustar
      `test/common/docs.e2e-spec.ts`.
- [x] 2.4 Cambiar la ruta protegida de `/tasks` a `/health` en `test/auth/session.e2e-spec.ts`,
      `test/auth/admin.e2e-spec.ts`, `test/common/production.e2e-spec.ts` y `test/common/middleware.e2e-spec.ts`.
- [x] 2.5 Borrar `packages/contracts/src/tasks.ts`, `profile.ts` y sus pruebas.
- [x] 2.6 Borrar `packages/database/src/schema/task.ts` y `profile.ts`, y actualizar `client.ts`.
- [x] 2.7 Regenerar la migración `0000_db_init` con `db:generate` y reiniciar la base local.

**Criterios de aceptación**

- La migración solo contiene las tablas de Better Auth.
- OpenAPI solo documenta las rutas de health (y las de Better Auth, si ya se documentaban).
- Las pruebas de sesión, expiración, baneo, límite de peticiones y middlewares pasan contra `/health`.
- `npm run check` y las pruebas de `apps/api`, `packages/contracts` y `packages/database` pasan.

### Fase 3. Frontend

La interfaz se construye con componentes de shadcn/ui del paquete `@autana/ui`, siguiendo la habilidad `shadcn` y la
guía [componentes-shadcn](../guias/frontend/componentes-shadcn.md). Ya están instalados, entre otros, `card`, `badge`,
`alert`, `skeleton`, `field`, `input`, `button`, `separator` y `sonner`. Si hace falta otro (por ejemplo, `progress`
para el uso de memoria y disco), se añade con la CLI de shadcn, no se escribe a mano. No se crean componentes propios
que dupliquen uno de shadcn.

- [x] 3.1 Borrar `apps/app/src/features/tasks/` y `apps/app/src/features/profile/`.
- [x] 3.2 Crear `features/status/`: `api/fetch-health.ts`, `hooks/use-health-query.ts`, `pages/status-page.tsx` y
      `routes.tsx`, en la ruta índice `/`.
- [x] 3.3 Crear `features/account/`: trasladar `name-form`, `name-form-schema` y `update-name` desde `profile`, y crear
      `pages/account-page.tsx` y `routes.tsx` en `/account`.
- [x] 3.4 Registrar las rutas en `app/router.tsx` con `createPanelRoutes([statusRoutes, accountRoutes])` y quitar la
      redirección de `/`.
- [x] 3.5 Cambiar la redirección de `auth-layout.tsx` y los comentarios de `sign-in-page.tsx` y `sign-up-page.tsx` a
      `/`.
- [x] 3.6 Actualizar la navegación: "Estado" y "Cuenta" en `app-sidebar.tsx`, y "Cuenta" hacia `/account` en
      `nav-user.tsx`.
- [x] 3.7 Añadir pruebas de `fetch-health`, `status-page`, `account-page` y `update-name`.
- [x] 3.8 Actualizar las pruebas de `router`, `auth-layout`, `sign-in-page`, `sign-up-page`, `nav-user`, `nav-main`,
      `site-header` y `panel-layout` que usan `/tasks` o `/profile`.

**Criterios de aceptación**

- Tras iniciar sesión o registrarse, la aplicación lleva a `/`; con sesión, las páginas de autenticación redirigen a
  `/`.
- La página de estado muestra el estado global y el de base de datos, memoria y disco, se refresca periódicamente y
  muestra el detalle también cuando la API responde 503.
- La página de cuenta muestra nombre, correo, verificación del correo y fecha de alta, y permite cambiar el nombre con
  validación y mensaje de error.
- La barra lateral y el menú de usuario solo enlazan a rutas existentes.
- Las páginas usan componentes de shadcn/ui de `@autana/ui`, coherentes con el bloque `dashboard-01`, y los componentes
  nuevos se añadieron con la CLI de shadcn.
- `npm run check` y las pruebas de `apps/app` pasan.

### Fase 4. Documentación

- [x] 4.1 Reescribir `docs/guias/general/retirar-funcionalidades-de-ejemplo.md` como guía para sustituir las páginas de
      ejemplo.
- [x] 4.2 Sustituir `docs/prd/ejemplo-tareas.md` por `docs/prd/ejemplo-estado-y-cuenta.md` y borrar
      `docs/plans/ejemplo-tareas.md`; actualizar los `README.md` de `docs/prd/` y `docs/plans/`.
- [x] 4.3 Actualizar `docs/arquitectura/05-vista-de-bloques.md` y `06-vista-de-ejecucion.md`.
- [x] 4.4 Documentar la salud (liveness, readiness y detalle) en `08-conceptos-transversales.md` y las decisiones en
      `09-decisiones.md`.
- [x] 4.5 Actualizar `docs/guias/backend/nueva-ruta.md`, `docs/guias/frontend/nueva-funcionalidad/README.md` y
      `README.md`.
- [x] 4.6 Ejecutar Prettier y `markdownlint-cli2` sobre los archivos editados.

**Criterios de aceptación**

- Ningún documento cita `tasks` ni `profile` como funcionalidades existentes.
- Los enlaces entre documentos resuelven.
- Prettier y `markdownlint-cli2` no reportan errores.

### Fase 5. Verificación final

- [ ] 5.1 Ejecutar `npm run check` y `npm test`, incluidas las e2e y el umbral de cobertura.
- [ ] 5.2 Buscar referencias restantes con
      `grep -rniE "tasks?\b|profile" apps packages docs --include=*.ts --include=*.tsx --include=*.md --exclude-dir=node_modules`.
- [ ] 5.3 Arrancar la aplicación y recorrer registro, inicio de sesión, página de estado, página de cuenta, edición del
      nombre y cierre de sesión.

**Criterios de aceptación**

- Todas las comprobaciones y pruebas pasan sin modificar reglas, umbrales ni configuración de las herramientas.
- La búsqueda no devuelve referencias al ejemplo retirado, salvo coincidencias ajenas justificadas.
- El recorrido manual funciona de principio a fin.

## Riesgos

- **Cobertura:** eliminar código muy probado puede bajar la cobertura por debajo del umbral. Si ocurre, se informa y se
  añaden pruebas; el umbral no se modifica.
- **Disco:** el indicador de disco comprueba `/`. En contenedores o en Windows puede necesitar otra ruta; se documenta
  como limitación.
- **Migración:** regenerar `0000_db_init` obliga a reiniciar las bases locales existentes con `db:reset`.
