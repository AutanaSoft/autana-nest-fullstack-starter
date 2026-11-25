# Vista de ejecución

## Backend

### Ciclo de una petición

1. `requestId` genera un identificador por petición, lo guarda en la petición y lo devuelve en la cabecera
   `X-Request-Id`. Reutiliza el del cliente si tiene hasta 255 caracteres de `[A-Za-z0-9_=-]` y, si no, genera un UUID.
2. `requestLogger` registra la petición cuando termina, con ese identificador, el estado y la duración.
3. `useSecurityHeaders` añade las cabeceras de seguridad a la respuesta.
4. CORS responde al preflight y añade las cabeceras CORS a las peticiones de `WEB_ORIGIN`.
5. `compression` comprime la respuesta con `gzip` según `Accept-Encoding`.
6. `enableCsrfProtection` rechaza con `403` las peticiones que cambian estado desde otro origen.
7. Los middlewares del módulo, como `noStore`, se ejecutan para las rutas del controlador.
8. Los guards globales se ejecutan en este orden: `ThrottlerGuard` responde `429` si la IP supera el límite (solo se
   registra con `NODE_ENV=production`) y `AuthGuard` responde `401` si no hay sesión, salvo en las rutas
   `@AllowAnonymous()`.
9. `StandardSchemaSerializerInterceptor` envuelve la ejecución del controlador para validar la respuesta al salir.
10. `ContractValidationPipe` valida `param`, `query` y `body` con los esquemas del contrato. Si la validación falla,
    responde el error público del destino que falló.
11. El controlador llama al servicio, que consulta, autoriza y ejecuta la acción.
12. El interceptor valida y filtra la respuesta con el esquema declarado en `@ResponseSchema`.
13. Cualquier excepción llega a `AllExceptionsFilter`, que responde con el contrato de error.

Los guards se ejecutan después de los middlewares y antes de los pipes. Por eso una petición sin sesión recibe `401`
aunque además sea inválida. Los middlewares globales se registran en `configureApp`, en este orden, y `requestId` va
primero porque los demás lo usan, incluido el rechazo de CSRF. Qué hace cada pieza se describe en
[Middlewares](./08-conceptos-transversales.md#middlewares).

Las rutas `/v1/auth/*` siguen otro camino. `AuthModule` monta Better Auth como un middleware de Express, que atiende la
petición tras los middlewares globales de los pasos 1 a 6 y antes de los guards: no le alcanzan los guards, el
interceptor, los pipes ni el filtro de excepciones. Sus errores no siguen el contrato de error de la API, y el límite de
peticiones de Nest no las cuenta.

## Frontend

### Rutas y layouts

El árbol de rutas se compone así:

```text
RootLayout (ErrorBoundary: ErrorPage)
├── <funcionalidad pública>          layout propio, sin guarda de sesión
│   ├── (index)  página principal
│   └── <ruta>   otras páginas
├── <funcionalidad protegida>        layout propio con guarda de sesión
│   ├── (index)  página principal
│   └── <ruta>   otras páginas
└── *                                NotFoundPage
```

- Cada `routes.tsx` exporta una ruta con su layout y sus páginas hijas. `app/router.tsx` solo las ensambla.
- Un layout no declara rutas. Es la ruta padre y muestra la página activa con `<Outlet />`. Las páginas nuevas se añaden
  como hijas de su layout.
- La guarda de sesión vive en el layout de la funcionalidad protegida, no en `app/`. Redirige a la pantalla de acceso
  cuando no hay sesión y muestra un estado de carga mientras la comprueba. Las funcionalidades públicas no la llevan.
- El layout de cada funcionalidad aporta la cabecera de página y el contenedor del contenido.
- Si varias funcionalidades comparten un mismo shell (por ejemplo, una barra lateral), este vive en `components/common/`
  y recibe su navegación por props, porque lo compartido no conoce los destinos de cada funcionalidad.
- El `ErrorBoundary` de `RootLayout` muestra `ErrorPage` ante un error inesperado. La ruta `*` muestra `NotFoundPage`.
- Las páginas de una funcionalidad se cargan de forma diferida cuando su peso lo justifique. La carga diferida se
  declara en `routes.tsx`.

[React Router: rutas anidadas y `Outlet`](https://reactrouter.com/start/data/routing)

### Flujo de datos

```text
ProductsPage ──► useProductFilters (hooks/) ──► filtros y página en la URL
     │
     ├──► useProductsQuery (hooks/) ──► fetchProducts (api/fetch-products.ts) ──► cliente HTTP ──► API
     │
     └──► ProductList (components/lists/)
```

La página lee los filtros del hook de la URL y llama al hook de consulta. El hook usa la librería de consultas y ejecuta
la función de `api/`, que realiza la petición y valida la respuesta con el esquema del contrato. La página entrega los
datos a sus componentes.
