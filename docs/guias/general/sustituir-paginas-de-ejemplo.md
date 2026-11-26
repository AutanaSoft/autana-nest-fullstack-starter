# Sustituir las páginas de ejemplo

La base de la plantilla es `auth` y `health` en la API, y `auth` y `panel` en el frontend. Sobre ella, el frontend
incluye dos páginas de ejemplo que solo usan esa base y no tienen tablas ni endpoints propios:

- **Estado** (`apps/app/src/features/status/`): la página de inicio del panel, en `/`. Muestra el detalle de
  `GET /health`.
- **Cuenta** (`apps/app/src/features/account/`): en `/account`. Muestra los datos de la sesión de Better Auth y permite
  cambiar el nombre.

Puedes conservarlas, sustituirlas o retirarlas. Para crear tus funcionalidades, sigue las guías de
[backend](../backend/nueva-ruta.md) y [frontend](../frontend/nueva-funcionalidad/README.md).

## Sustituir la página de inicio

La raíz `/` es la ruta índice del panel, y las demás piezas de la base ya redirigen a ella: tras iniciar sesión o
registrarse (`features/auth/layouts/auth-layout.tsx`) y desde el logotipo de la barra lateral. Para que tu funcionalidad
sea la página de inicio, declárala como índice en su `routes.tsx`:

```tsx
export const <feature>Routes: RouteObject = {
  index: true,
  handle: { title: "<Título>" } satisfies RouteHandle,
  lazy: async () => ({ Component: (await import("./pages/<feature>-page")).<Feature>Page }),
}
```

Si la página de estado pasa a otra ruta, cambia `index: true` por `path: "/status"` en `features/status/routes.tsx` y su
enlace en la barra lateral.

## Retirar una página

1. Borra su carpeta, `apps/app/src/features/status/` o `apps/app/src/features/account/`.
2. Quita su ruta de `createPanelRoutes([...])` en `apps/app/src/app/router.tsx`.
3. Quita su entrada de `navMain` en `features/panel/components/app-sidebar.tsx` y elimina el icono si queda sin usar.
4. Para la cuenta, quita también el elemento "Cuenta" de `features/panel/components/nav-user.tsx`, sus imports `Link` y
   `CircleUserRoundIcon` si quedan sin usar, y la prueba "el menú enlaza con la cuenta" de `nav-user.test.tsx`.
5. Si retiras la página de estado sin declarar otra como índice, la raíz `/` mostrará la página 404. Declara otra página
   como índice o redirige la raíz a ella.

Las pruebas del panel (`nav-main`, `site-header` y `panel-layout`), de `router.test.tsx` y de autenticación usan `/` y
`/account` como rutas de prueba. Actualízalas si esas rutas dejan de existir.

## Lo que no se retira

- El módulo `health` de la API. `GET /health/live` y `GET /health/ready` son las comprobaciones del orquestador, y las
  pruebas de integración usan `GET /health` como ruta protegida (`test/auth/` y `test/common/`).
- El contrato `packages/contracts/src/health.ts`, que usa ese módulo.

## Comprobación

Ejecuta `npm run check` y `npm test`. Busca también referencias que hayan quedado:

```bash
grep -rniE "status|account|/health" apps/app/src --include=*.ts --include=*.tsx
```
