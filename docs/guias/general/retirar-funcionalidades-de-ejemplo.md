# Retirar las funcionalidades de ejemplo

La plantilla incluye dos funcionalidades de ejemplo, `tasks` y `profile`, para probar de punta a punta la autenticación,
la API, la base de datos y el frontend. Cuando tu proyecto defina sus propias funcionalidades, retíralas siguiendo esta
guía. `auth`, `panel` y `health` forman parte de la base y se conservan.

Antes de borrar, usa `tasks` como referencia de una funcionalidad completa: su código está en
`apps/api/src/modules/tasks/` y `apps/app/src/features/tasks/`, y `profile` ilustra una relación uno a uno con el
usuario. Las guías de [backend](../backend/nueva-ruta.md) y [frontend](../frontend/nueva-funcionalidad/README.md)
explican el patrón con una entidad genérica.

## Qué se elimina

1. **API:** las carpetas `apps/api/src/modules/tasks/` y `apps/api/src/modules/profile/`, sus módulos en `imports` de
   `apps/api/src/app.module.ts` (`TasksModule` y `ProfileModule`) y sus esquemas en
   `apps/api/src/common/openapi/openapi-schemas.ts` (`Task`, `ListTasksResponse`, `CreateTask`, `UpdateTask`, `Profile`
   y `UpdateProfile`).
2. **Contratos:** `packages/contracts/src/tasks.ts`, `profile.ts` y sus archivos `.test.ts`.
3. **Base de datos:** `packages/database/src/schema/task.ts` y `profile.ts`, y su importación en
   `packages/database/src/client.ts` (`schema = { ...auth, ...profile, ...task }`).
4. **Frontend:** las carpetas `apps/app/src/features/tasks/` y `apps/app/src/features/profile/`, y su registro en
   `apps/app/src/app/router.tsx` (`createPanelRoutes([tasksRoutes, profileRoutes])`). Con una lista vacía,
   `createPanelRoutes([])`, compila.
5. **Pruebas de la API:** `apps/api/test/tasks/`, `apps/api/test/profile/` y
   `apps/api/test/database/app-schema.e2e-spec.ts`, que comprueban solo las tablas del ejemplo. En
   `apps/api/test/common/docs.e2e-spec.ts`, elimina de las pruebas del documento OpenAPI lo que cita las rutas y los
   esquemas de tareas y perfil.

## Qué más referencia el ejemplo

La base usa `/tasks` como primera pantalla privada y `/profile` como enlace del menú de usuario. Sustituye esas
referencias por las de tu primera funcionalidad:

- `features/auth/layouts/auth-layout.tsx`: destino de la redirección cuando ya hay sesión. Si queda apuntando a
  `/tasks`, ninguna prueba lo detecta y la pantalla de inicio llevaría a una ruta inexistente.
- `features/panel/components/app-sidebar.tsx`: elementos de navegación y enlace del logotipo. Al quitar el icono
  `UserIcon` elimina también su import.
- `features/panel/components/nav-user.tsx`: elimina el elemento "Perfil" o apúntalo a otra ruta. Si lo eliminas, quita
  los imports `Link` y `CircleUserRoundIcon` y la prueba "el menú enlaza con el perfil" de `nav-user.test.tsx`.
- `app/router.tsx`: redirección de la ruta raíz `/`.
- `apps/api/test/auth/session.e2e-spec.ts`, `test/auth/admin.e2e-spec.ts`, `test/common/production.e2e-spec.ts` y
  `test/common/middleware.e2e-spec.ts`: usan `/tasks` como ruta protegida de ejemplo (cierre de sesión, expiración,
  baneo, límite de peticiones y middlewares). Cámbiala por una ruta de tu API que exija sesión.
- Pruebas del frontend que esperan `/tasks` o `/profile`: `router.test.tsx`, `auth-layout.test.tsx`,
  `sign-in-page.test.tsx` y `sign-up-page.test.tsx`. Las del panel (`nav-main`, `site-header`, `panel-layout`) usan
  `/tasks` solo como ruta de prueba y no fallan, pero conviene renombrarla.
- Los comentarios de `sign-in-page.tsx` y `sign-up-page.tsx` que citan `/tasks`.

## Regenerar la migración

El esquema de `task` y `profile` está en la migración `0000_db_init`. Mientras no haya datos que preservar, regénerala
siguiendo [Comandos](./comandos.md): borra `packages/database/migrations/`, ejecuta `db:generate` con `--name db_init`,
reinicia tu base con `npm run db:reset` y elimina la base de pruebas `<base>_test`.

## Comprobación

Ejecuta `npm run check` y `npm test`. Busca también referencias que hayan quedado:

```bash
grep -rniE "tasks?\b|profile" apps packages --include=*.ts --include=*.tsx --exclude-dir=node_modules
```
