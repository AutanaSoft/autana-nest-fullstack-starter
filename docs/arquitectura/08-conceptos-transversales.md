# Conceptos transversales

## Backend

### Compilación y desarrollo

`apps/api` se compila con SWC mediante la CLI de Nest (`nest build`, con `builder: swc` en `nest-cli.json`) a `dist/`.
SWC solo transforma el código: no comprueba tipos. `npm run typecheck` ejecuta `tsc --noEmit` y debe correrse aparte.

- **Imports relativos.** El proyecto es ESM con `module: nodenext`, por lo que los imports relativos de la API terminan
  en `.js`.
- **Paquetes del workspace.** `contracts` y `database` se distribuyen como fuente TypeScript y SWC no los compila:
  Node.js los ejecuta quitando los tipos. Por eso los imports relativos entre sus archivos llevan la extensión `.ts`, y
  `tsconfig.json` activa `rewriteRelativeImportExtensions` para que `tsc` los acepte.
- **TypeScript.** `apps/api` usa TypeScript 6, que es el que admite la CLI de Nest, y no la versión del resto del
  monorepo.
- **Desarrollo.** `npm run dev` ejecuta mediante Turborepo la tarea `dev` de `apps/api`, que lanza `nest start --watch`
  con `NODE_ENV=development`: compila con SWC y reinicia Node cuando cambia el código. `NODE_ENV=development` es lo que
  activa la documentación.
- **Producción.** `npm run build` genera `dist/` y `npm run start:prod` ejecuta `node dist/main`.
- **Puerto.** `app.config.ts` lee `PORT` (3000 por defecto, y también si está vacío). Una variable definida en el
  entorno prevalece sobre el `.env`.

### Definición de un endpoint

Cada funcionalidad es un módulo de Nest con un controlador y un servicio. El controlador solo se ocupa de HTTP y el
servicio contiene las reglas y las consultas.

- `@Controller('<name>')` fija la ruta relativa al prefijo `/v1`, y `@Get`, `@Post`, `@Put`, `@Patch` o `@Delete` el
  método. Escribe los parámetros de ruta con dos puntos, como `:resourceId`; OpenAPI los publica con llaves.
- Valida cada entrada con el esquema Zod del paquete `contracts`: `@Body({ schema })`, `@Query({ schema })` y
  `@Param('<name>', { schema })`. El controlador declara el error público de cada destino con
  `@UsePipes(new ContractValidationPipe({ ... }))`.
- Declara el esquema de la respuesta correcta con `@ResponseSchema(schema, status)`. El mismo decorador activa la
  serialización y publica el esquema en la documentación. Declara los demás estados con `@ApiBadRequestResponse`,
  `@ApiUnauthorizedResponse` y similares, indicando `standardSchema: errorResponseSchema`.
- Un `DELETE` sin cuerpo responde `204` con `@HttpCode(204)`.
- Si todas las rutas del módulo exigen que no se guarde la respuesta, el módulo registra el middleware `noStore` en
  `configure(consumer)`. Las rutas exigen sesión salvo que se marquen con `@AllowAnonymous()`.

El controlador recibe la sesión con `@Session() session: UserSession` y pasa `session.user.id` al servicio. En el
servicio:

1. Consulta con Drizzle y autoriza. Limita siempre el acceso a la cuenta autenticada y lanza `NotFoundException` cuando
   un recurso es ajeno, para no revelar qué identificadores existen.
2. Ejecuta la acción. En una mutación, incluye el propietario y la precondición de estado en el `WHERE`. Si una
   operación concurrente impide que se modifique la fila, lanza `ConflictException` (`409`) con un código propio de la
   operación.
3. Devuelve el valor en el tipo del contrato. No serializa: lo hace el interceptor.

Las reglas que relacionan varios campos de una petición se comprueban en el servicio y responden con el error público de
la operación.

#### Ejemplo genérico

Consulta la guía [Definir una ruta en el backend](../guias/backend/nueva-ruta.md).

### Validación y errores

`ContractValidationPipe` convierte un fallo de validación en el error público de la operación según el destino que falló
(`param`, `query` o `body`). El pipe estándar no informa del destino, por lo que cada controlador declara los códigos de
su módulo.

`AllExceptionsFilter` es el único manejador de errores de las rutas de Nest y responde siempre con el cuerpo de
`errorResponseSchema` (`packages/contracts/src/errors.ts`). Las rutas de `/v1/auth/*` no pasan por él: sus errores
tienen la forma nativa de Better Auth, como explica [Autenticación y autorización](#autenticación-y-autorización).

```json
{
  "message": "Resource not found",
  "error": "Not Found",
  "statusCode": 404,
  "code": "NOT_FOUND",
  "requestId": "3f2b8c1e-7a4d-4e9b-a6c5-1d2e8f90b7a3"
}
```

- `code` es el identificador estable. El cliente decide qué mostrar según él, nunca según `message`.
- `message` está en inglés y es un texto fijo por `code`: nunca contiene el detalle de una excepción.
- `error` y `statusCode` salen siempre del estado HTTP, porque `createErrorResponse`
  (`src/common/errors/error-response.ts`) los deriva de él.
- `requestId` es el de la cabecera `X-Request-Id`, para que el usuario pueda indicarlo al reportar un fallo.

| Origen                                    | Estado  | Código                                           |
| ----------------------------------------- | ------- | ------------------------------------------------ |
| Excepción de Nest con `{ code, message }` | La suya | El indicado                                      |
| Otra excepción de Nest                    | La suya | Uno fijo por estado: `BAD_REQUEST`, `HTTP_ERROR` |
| Error inesperado                          | `500`   | `INTERNAL_ERROR`, y se registra en el log        |
| Ruta inexistente bajo `/v1/`              | `404`   | `NOT_FOUND`                                      |
| Ruta inexistente fuera de `/v1/`          | `404`   | Página HTML por defecto de Express               |

- Un error inesperado se registra con su detalle y el `requestId`, y la respuesta no lo expone.
- Los códigos fijos por estado son `BAD_REQUEST` (`400`), `NOT_FOUND` (`404`), `UNSUPPORTED_MEDIA_TYPE` (`415`),
  `RATE_LIMITED` (`429`) y `HTTP_ERROR` para el resto.
- Un JSON malformado responde `400 BAD_REQUEST`.
- El límite de peticiones añade `Retry-After: 60` a su `429`.
- En los servicios, lanza una excepción de Nest con el código público de la operación, por ejemplo
  `new NotFoundException({ code: 'TASK_NOT_FOUND', message: 'Task not found' })`. El filtro la traduce al contrato.

### Serialización de respuestas con Zod

`StandardSchemaSerializerInterceptor` es global (`APP_INTERCEPTOR`). Valida y filtra con el esquema del contrato todas
las respuestas correctas, porque es la capa que impide que un dato interno o sensible llegue al cliente. Cada ruta que
devuelve un cuerpo declara su esquema con `@ResponseSchema`; una ruta sin esquema se devuelve tal cual.

- Declara los campos públicos con `z.object()` en cada nivel: el interceptor descarta las propiedades que el esquema no
  declara, como el propietario de una fila.
- Si el cuerpo no cumple el esquema, el interceptor lanza un error y el filtro responde `500 INTERNAL_ERROR` sin exponer
  el detalle.
- No uses `z.strictObject()` ni `.passthrough()` en los esquemas de respuesta. El primero convierte un campo adicional
  en un `500` y el segundo lo deja pasar.
- Los mappers de un módulo (`mappers/`) solo adaptan los tipos que el esquema no convierte, como las fechas de la base
  de datos. No filtran campos.
- Un mapper es una función tipada y no valida en ejecución lo que recibe de una consulta de Drizzle, porque el tipo ya
  lo garantiza. Solo valida con un esquema Zod cuando la entrada es externa o no tiene forma fija, como la respuesta de
  otro servicio o una columna `jsonb`. El esquema vive en `mappers/` junto al mapper y no forma parte del contrato.
- Las rutas de la librería de autenticación no pasan por el interceptor: Better Auth las atiende como middleware.

### Autenticación y autorización

- La integración usa `@thallesp/nestjs-better-auth`. `AuthModule.forRootAsync`, registrado en
  `modules/auth/auth.module.ts`, monta Better Auth como un middleware de Express en `/v1/auth/*`, con sus propios
  contratos y códigos de error, y excluye esa ruta del prefijo global. No definas rutas de autenticación propias ni
  controladores que las reenvíen.
- `auth.ts` crea la instancia de Better Auth con la configuración validada. Usa `@better-auth/drizzle-adapter` con
  `advanced.database.generateId: "uuid"`, que con PostgreSQL delega la generación del id en la base de datos. Habilita
  el acceso con correo y contraseña (de 8 a 64 caracteres) y acepta peticiones del origen de la variable `WEB_ORIGIN`
  (`http://localhost:5173` por defecto). El plugin `openAPI`, que publica `/v1/auth/reference`, solo se registra cuando
  la documentación está activa (`openApiConfig.enabled`). `hooks` y `databaseHooks` van vacíos: el paquete los necesita
  para registrar los hooks de las clases con `@Hook()` y `@DatabaseHook()`.
- El adaptador usa `transaction: true`, de modo que las operaciones de Better Auth que escriben varias filas, como el
  registro, se ejecutan en una transacción: si falla la inserción de la cuenta, no queda un usuario sin cuenta.
  `advanced.database.joins: true` reduce las consultas de la sesión (una menos en cada petición protegida) y exige las
  relaciones de Drizzle de `schema/auth.ts` (`userRelations`, `sessionRelations` y `accountRelations`), que se pasan al
  adaptador con el resto del schema.
- `auth.ts` fija el `basePath` en `${apiBasePath}/auth`. La variable de entorno con la URL base no debe incluir una
  ruta, porque tendría prioridad; el esquema de entorno lo comprueba.
- Las reglas de la cuenta (nombre, correo y contraseña) viven en `packages/contracts/src/auth.ts` y las usan el
  formulario y el servidor. El servidor las aplica en `UserValidationHook` (`@BeforeCreate("user")` y
  `@BeforeUpdate("user")`), para cubrir todos los endpoints que crean o modifican un usuario, no solo el registro.
  Guarda los valores normalizados (nombre recortado, correo en minúsculas) y, si una regla falla, responde `400` con
  `INVALID_NAME` o `INVALID_EMAIL` y un `message` fijo. Los mensajes de las reglas son el texto del formulario y nunca
  salen de la API. Los límites de la contraseña (`passwordLength`) se leen del mismo contrato en la configuración de
  Better Auth.
- Las respuestas de `/v1/auth/*` no pasan por `AllExceptionsFilter`: los errores tienen la forma nativa de Better Auth
  (`{ code, message }`), sin `requestId` ni `statusCode`, y coinciden con lo que documenta `/v1/auth/reference`. El
  `message` de `VALIDATION_ERROR` incluye el detalle del esquema de Better Auth. El cliente de Better Auth del frontend
  lee `error.code` de esa forma.
- `AuthGuard` es un guard global (`APP_GUARD`, registrado por `AuthModule`). Deja la sesión en `request.session` y
  `request.user`, y el controlador la lee con `@Session()`. Sin sesión lanza `UnauthorizedException`, que
  `AllExceptionsFilter` responde con `401` y el código `SESSION_REQUIRED` y un mensaje fijo, que no distingue una cookie
  ausente, caducada o manipulada. `@AllowAnonymous()` abre una ruta o un controlador al guard.
- Límite de intentos de acceso: Better Auth aplica el suyo a `/v1/auth/*` (3 peticiones cada 10 s en `/sign-in`,
  `/sign-up` y `/change-password`, solo con `NODE_ENV=production`), porque `ThrottlerGuard` no alcanza esas rutas. Toma
  la IP de `X-Forwarded-For`, que sin proxy es falsificable y, con una cadena de proxies, no se puede resolver: todos
  los clientes compartirían el contador. Con `CLIENT_IP_HEADER` (por ejemplo `CF-Connecting-IP` detrás de Cloudflare) la
  toma de esa cabecera, que solo es fiable si el proxy la sobrescribe siempre y el servidor no acepta tráfico que no
  pase por él.
- Con `NODE_ENV=production`, la cookie de sesión lleva `Secure` aunque el proceso reciba `http` de un proxy.
- El plugin `admin` de Better Auth (`admin()` en `auth.ts`, con sus valores por defecto) añade el rol y el baneo de la
  cuenta: `user.role` (`user` por defecto), `banned`, `banReason` y `banExpires`, y `session.impersonatedBy`. Sus rutas
  están bajo `/v1/auth/admin/*` (`set-role`, `ban-user`, `unban-user`, `list-users`, `impersonate-user` y otras), con el
  formato de error nativo de Better Auth, y solo las usa quien tiene el rol `admin`; sin control de acceso propio no
  existen más roles. Un usuario baneado recibe `403` con el código `BANNED_USER` al iniciar sesión, y banearlo revoca
  sus sesiones. Un baneo con fecha de vencimiento pasada se levanta solo en el siguiente inicio de sesión. Para proteger
  una ruta propia por rol se usa `@Roles(["admin"])`, que lee `session.user.role`. No hay un primer administrador: el
  rol se asigna con SQL directo.
- La autorización se hace en el servicio: toda consulta se limita a la cuenta autenticada, y un recurso ajeno responde
  `404`.

### Middlewares

Los middlewares globales se registran en `configureApp` (`src/app.setup.ts`) y las piezas compartidas viven en
`src/common/middleware/`. Su orden de registro, que importa, está en
[Ciclo de una petición](./06-vista-de-ejecucion.md#ciclo-de-una-petición).

- **Registro.** `requestLogger` escribe una línea por petición con el `requestId`, el método, la ruta, el estado y la
  duración. No registra cabeceras ni cuerpos.
- **Cabeceras de seguridad.** `app.useSecurityHeaders()`. Con `NODE_ENV=production` añade una CSP que no permite cargar
  nada (`default-src 'none'`); en cualquier otro entorno se omite porque la documentación (Scalar) carga scripts,
  estilos y fuentes de un CDN.
- **CORS.** Solo acepta el origen `WEB_ORIGIN`, con `credentials: true`, y expone `X-Request-Id`. Con el frontend y la
  API en el mismo origen el navegador no lo usa; con dominios distintos lo exige.
- **Compresión.** `compression` comprime con `gzip` las respuestas de más de 1 kB que el cliente acepta.
- **CSRF.** `app.enableCsrfProtection({ trustedOrigins: [WEB_ORIGIN] })`, en todas las rutas, también en `/v1/auth/*`.
  Las peticiones `GET`, `HEAD` y `OPTIONS` pasan. En las demás, rechaza con `403` las que `Sec-Fetch-Site` marca como de
  otro origen o, si la cabecera falta, cuyo `Origin` no coincide con `Host`, salvo que el `Origin` sea de confianza.
  `WEB_ORIGIN` lo es, porque CORS no confía automáticamente en un origen. Una petición sin `Sec-Fetch-Site` ni `Origin`,
  que no es de un navegador, pasa. No depende de cookies ni de tokens.
- **Límite de peticiones.** `@nestjs/throttler`, solo en producción, para que el desarrollo y las pruebas no choquen con
  él. `RateLimitModule` (`src/common/modules/`) configura un límite global por IP (100 por minuto) y otro para las
  escrituras (20 por minuto); `AppModule` registra `ThrottlerGuard`, para que se ejecute antes que el guard de sesión.
  `/v1/auth/*` queda fuera, porque Better Auth lo atiende como middleware y aplica su propio límite. Responde
  `429 RATE_LIMITED` con `Retry-After`. Con `TRUST_PROXY=true` toma la IP de la última entrada de `X-Forwarded-For`;
  actívalo solo detrás de un proxy inverso que la añada.

### Caché

Las respuestas no se guardan en una caché del servidor. Las rutas cuyo contenido no debe almacenarse añaden
`Cache-Control: no-store` con el middleware `noStore` (`src/common/middleware/no-store.middleware.ts`), y la librería de
autenticación lo añade a las suyas. Los middlewares del módulo se ejecutan antes que el guard de sesión, por lo que
`noStore` también alcanza al `401`.

### Datos

- **Nombres de las bases de datos.** `DATABASE_URL` es la única variable de conexión y apunta a la base de desarrollo.
  `<base>` es el nombre con el que termina esa URL. Las pruebas derivan su base añadiéndole un sufijo, en el mismo
  servidor: `<base>_test` para las de Vitest. Cambiar el nombre en `DATABASE_URL` cambia las dos, y ningún archivo del
  código ni de la documentación escribe un nombre fijo. La preparación de las bases de pruebas se describe en
  [Particularidades del backend](#particularidades-del-backend).
- `packages/database/src/schema/<name>.ts` define las tablas de cada módulo.
- `apps/api/src/database/database.module.ts` registra el cliente de Drizzle con `@nestjs/drizzle` a partir de
  `createDatabase` del paquete `database`. El módulo cierra el pool al apagar la aplicación, porque `main.ts` activa los
  hooks de cierre.
- `packages/database/drizzle.config.ts` configura Drizzle Kit, y `packages/database/migrations/` contiene las
  migraciones versionadas. Se generan con `npm run db:generate` y se aplican con `npm run db:migrate`. El `DATABASE_URL`
  de ese comando sale de `packages/database/.env`. Mientras no haya datos que preservar hay una sola migración,
  `0000_db_init`, que se regenera al cambiar el esquema en lugar de añadir otra. La guía de
  [comandos](../guias/general/comandos.md) explica cómo.
- `npm run db:reset` deja la base de `DATABASE_URL` como recién creada: en una transacción elimina los esquemas `public`
  y `drizzle` y recrea `public`, y después aplica las migraciones. Muestra la base, el host y el entorno, y exige
  escribir el nombre de la base y responder `yes`; no hay forma de omitirlo. Además, `resetDatabase` se niega con
  `NODE_ENV=production` y con un nombre de base no válido. Al eliminar `public` se pierden también sus extensiones; la
  plantilla no usa ninguna, y si se añade una debe recrearse en `reset.ts`. Sus pruebas, en `packages/database/test/`,
  usan una base temporal propia, porque el reinicio destruye el esquema.
- Los identificadores son `uuid` y los genera PostgreSQL con `pg_catalog.gen_random_uuid()`. Las columnas de fecha son
  `timestamptz` (`timestamp` con `withTimezone: true`).
- `packages/database/src/schema/auth.ts` define las tablas de Better Auth (`user`, `session`, `account` y
  `verification`, con las columnas del plugin `admin`) y es la fuente de verdad. Lo genera la CLI de Better Auth y solo
  se personaliza en dos puntos: las columnas de fecha son `timestamptz`, porque la CLI crea `timestamp` sin zona
  horaria, y `updated_at` de `session` y `account` tiene `defaultNow()`. Así, al regenerarlo en un archivo temporal las
  diferencias se limitan a esas personalizaciones y a lo que cambie en Better Auth; la guía
  [Regenerar y comparar el esquema de Better Auth](../guias/backend/esquema-better-auth.md) explica cómo. Better Auth
  comprueba que el esquema coincida con lo que necesita (`validateSchema`, activo fuera de producción).

### Configuración y entornos

- Cada dominio que necesita configuración tiene su archivo `src/config/<name>.config.ts` con el esquema de sus variables
  de entorno, una función `build` que lo valida con `parse` y devuelve la configuración, y su registro con `registerAs`.
  Las variables de entorno conservan su nombre (`UPPER_SNAKE_CASE`) y las variables propias, derivadas o constantes, van
  en `camelCase`, de modo que se distingue de dónde viene cada valor. Cada configuración exporta un solo tipo, derivado
  de `build`. La guía [Definir una configuración](../guias/backend/nueva-configuracion.md) muestra el patrón.
- `validateEnv` (`src/config/env.validation.ts`) valida todo el entorno al arrancar con los esquemas de todos los
  dominios y detiene el proceso con un mensaje que nombra cada variable inválida, no solo la primera. Los servicios
  reciben la configuración ya validada y con sus valores por defecto inyectando `<name>Config.KEY`, y no leen
  `process.env`.
- `ConfigModule` carga el `.env` de `apps/api`, que no se versiona y contiene los valores propios de cada equipo, y solo
  lo carga si existe. Una variable definida en el entorno prevalece sobre el archivo. Usa una ruta relativa al
  directorio de ejecución, por lo que los scripts del workspace deben ejecutarse desde `apps/api`.
  `vitest.config.e2e.ts` lee el `.env` con `loadEnv` y lo pasa a las pruebas de integración mediante `test.env`.
- `packages/database/drizzle.config.ts` carga `packages/database/.env` con el mismo criterio, y tampoco usa
  `import.meta.dirname`, que no existe cuando Drizzle Kit carga el archivo como CommonJS.
- Cada workspace tiene su propio `.env` (`apps/api/.env`, `apps/app/.env` y `packages/database/.env`). El frontend lo
  lee con `loadEnv` y el `envDir` por defecto de Vite, y su proxy de desarrollo usa `API_PROXY_TARGET`, sin depender de
  variables de la API.
- Cada `.env.example` se versiona, lista las variables del workspace con valores de ejemplo y sin secretos, y sirve de
  plantilla.
- En producción no existe `.env`: el despliegue define las variables de entorno y debe definir `NODE_ENV=production`. La
  documentación solo se publica con `NODE_ENV=development`. Además, en producción se activan la CSP, el límite de
  peticiones de la API y, en la librería de autenticación, su propio límite y las cookies seguras.

## Frontend

### Estado

Cada tipo de estado tiene un único lugar:

- **Datos del servidor:** caché de la librería de consultas (hooks de la feature). Ejemplo: lista de recursos, detalle.
- **Filtros, página y orden:** parámetros de búsqueda de la URL. Ejemplo: `?status=archived&page=2`.
- **Valores de un formulario:** librería de formularios, dentro del componente. Ejemplo: campos y errores de validación.
- **Estado de interfaz puntual:** estado local del componente. Ejemplo: diálogo abierto, pestaña activa interna.
- **Sesión:** cliente de autenticación, consultado en el layout de la funcionalidad protegida. Ejemplo: usuario
  autenticado.
- **Preferencias de la app:** proveedor global en `app/providers.tsx`. Ejemplo: tema.

Reglas de uso:

- Los datos del servidor no se copian a estado local ni a un almacén global. La caché es la fuente de verdad.
- No se añade un almacén global de cliente salvo que un requisito concreto lo exija y ningún tipo de la lista lo cubra.
- Lo que el usuario debe recuperar al recargar o compartir un enlace va en la URL.

#### Estado en la URL

Los filtros y la paginación se guardan en los parámetros de búsqueda con `useSearchParams`, dentro de un hook de la
funcionalidad (por ejemplo, `useProductFilters`). Así sobreviven a una recarga y al botón Atrás.

- Un valor ausente o inválido se sustituye por el predeterminado, y el predeterminado no se escribe en la URL.
- Cambiar un filtro vuelve a la primera página.
- Los enlaces de paginación llevan un `href` real, que conserva el resto de filtros, y navegan sin recargar la página.
  En los extremos se muestra un botón deshabilitado.

[React Router: `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)

### Autenticación en el frontend

- `lib/auth-client.ts` crea el cliente de Better Auth con `basePath` igual a `${apiBasePath}/auth` y sin `baseURL`, de
  modo que usa el origen de la página. Lo comparten las funcionalidades que lo necesitan y el layout del panel.
- Las funciones de `features/auth/api/` llaman al cliente, que devuelve el error en lugar de lanzarlo, y lanzan un
  `Error` con un mensaje en español. El registro usa un mensaje genérico para no revelar qué correos ya existen.
- `PanelLayout` (`features/panel`) es el layout protegido de todas las pantallas privadas: sin sesión redirige a
  `/auth/sign-in`, y un fallo de red no redirige. `AuthLayout` redirige a la primera pantalla privada cuando ya hay
  sesión, y la raíz `/` hace lo mismo.
- Las páginas de acceso no navegan al terminar: la redirección de `AuthLayout` ocurre cuando la sesión ya existe. Si
  navegaran de inmediato, `PanelLayout` leería una sesión sin refrescar y redirigiría de vuelta al acceso durante unos
  milisegundos.
- **Mismo origen.** La cookie de sesión y la validación de `Origin` de Better Auth funcionan sin CORS cuando el
  navegador solo habla con un origen. En desarrollo lo garantiza el proxy de `server.proxy` en `vite.config.ts`, que
  reenvía `${apiBasePath}` al puerto `PORT` de la API. En producción debe hacerlo un proxy inverso que sirva el frontend
  y la API bajo el mismo dominio.
- **Dominios distintos del mismo sitio** (por ejemplo `app.example.com` y `api.example.com`): se activan con
  `VITE_API_URL`, que `lib/auth-client.ts` pasa como `baseURL`. El cliente de Better Auth ya envía las cookies en las
  peticiones entre orígenes. En la API, `WEB_ORIGIN` debe ser el origen real del frontend (lo usan CORS y
  `trustedOrigins`) y `BETTER_AUTH_URL` el de la API. La cookie de sesión queda ligada al dominio de la API y
  `SameSite=Lax` la envía porque ambos dominios son del mismo sitio. Fuera de desarrollo la cookie es `Secure`, así que
  ambos orígenes deben usar `https`.
- **Sitios distintos** (por ejemplo `miapp.com` y `miapi.com`) no están soportados: `SameSite=Lax` no envía la cookie de
  sesión y haría falta `SameSite=None`, que los navegadores restringen como cookie de terceros.

### Cliente HTTP y consultas

- `lib/api-client.ts` es la instancia de Axios para la API. Su `baseURL` es `VITE_API_URL` (o el origen de la página)
  seguido de `apiBasePath`, y envía las cookies (`withCredentials`). Las funciones de `api/` escriben las rutas sin el
  prefijo.
- `lib/api-error.ts` extrae el `code` público de un error de la API (`getApiErrorCode`), o `null` si el fallo no vino de
  ella. Las pantallas deciden qué mostrar según el código, nunca según el `message`.
- `lib/query-client.ts` crea el cliente de consultas. Reintenta dos veces, y solo ante una caída de red o un `5xx`: un
  `4xx` no cambia al repetirlo. Cuando la API responde `SESSION_REQUIRED` (por ejemplo, porque la sesión caducó), vuelve
  a consultar la sesión y `PanelLayout` redirige al acceso. `app/providers.tsx` lo monta.

### Errores, carga y estados vacíos

- **Error inesperado:** lo captura el `ErrorBoundary` de `RootLayout`.
- **Ruta inexistente:** la muestra `NotFoundPage`.
- **Error de una petición:** lo interpreta la función de `api/` que la realiza (o `api/errors.ts` si varias comparten la
  interpretación). La página decide cómo mostrarlo.
- **Respuesta inválida:** el esquema del contrato falla en `api/` y el error llega a la página como cualquier otro error
  de petición.
- **Carga y vacío:** cada página muestra un estado de carga (esqueleto) y un estado vacío explícito. Un error de
  petición no se confunde con un resultado vacío.
- **Error de envío de un formulario:** se muestra dentro del formulario, sin salir de la pantalla.

### Formularios

La página define `handleSubmit` con la acción de negocio y pasa esa función como `onSubmit` hasta el componente del
formulario. Los componentes intermedios, como una tarjeta, reenvían la función.

El componente que contiene el `<form>` inicializa la librería de formularios y controla los valores, la validación y la
presentación de errores. Valida con el esquema del formulario mediante su resolver. La página devuelve o espera la
promesa de la mutación, de modo que el formulario puede usar `isSubmitting` mientras se guarda y mostrar un mensaje si
el envío falla. [React Hook Form: `handleSubmit`](https://react-hook-form.com/docs/useform/handlesubmit)

### Estilos y sistema de diseño

- Los componentes base proceden de shadcn/ui y se instalan con su CLI en el paquete de interfaz compartido.
- Los colores, la tipografía y el modo oscuro se definen con variables CSS globales del paquete de interfaz. Los
  componentes los consumen mediante clases de utilidad y no definen valores propios.
- `className` aporta layout y espaciado. El aspecto de un componente se cambia con sus variantes, no con clases que
  sobrescriban su estilo.
- Si un componente base necesita un cambio de aspecto permanente, se modifica en el paquete de interfaz y no se replica
  en cada uso.
- Antes de sobrescribir un componente existente con el CLI, revisa la diferencia (`--diff`). No se usa `--overwrite` sin
  una decisión explícita.

[shadcn/ui: CLI](https://ui.shadcn.com/docs/cli)

### Accesibilidad, internacionalización y rendimiento

- **Accesibilidad:** los componentes de shadcn/ui aportan la semántica base. Los formularios asocian cada campo con su
  etiqueta y su mensaje de error (`aria-invalid`, `aria-describedby`).
- **Internacionalización:** no hay una librería de i18n definida. Los textos visibles se escriben en un único idioma,
  directamente en los componentes. Si se añade más de un idioma, esta sección debe definir dónde viven los textos.
- **Rendimiento:** los imports directos (sin `index.ts`) mantienen el árbol de dependencias explícito. La carga diferida
  de rutas se aplica donde el tamaño del bundle lo justifique: el panel y cada funcionalidad protegida se declaran con
  `lazy` en su `routes.tsx`, de modo que cada pantalla se descarga al entrar en ella y la primera carga solo incluye el
  núcleo.

### Convenciones de nombres

- Todos los archivos usan kebab-case: componentes, páginas, layouts, hooks y peticiones (`product-form.tsx`,
  `products-layout.tsx`, `products-page.tsx`). Es la convención de shadcn/ui y la del código existente
  (`app-sidebar.tsx`, `use-mobile.ts`).
- Los símbolos exportados mantienen la convención del lenguaje: PascalCase para componentes (`ProductForm`) y camelCase
  para hooks y funciones (`useProductsQuery`).
- Los hooks se nombran `use-<name>-query.ts`, `use-<name>-mutation.ts` y `use-<name>-filters.ts`. `<name>` puede incluir
  el verbo de la operación (`use-create-product-mutation.ts`).
- Los archivos de `api/` llevan el nombre de la operación (`fetch-products.ts`, `create-product.ts`).
- Los archivos de `schemas/` se nombran `<name>-schema.ts` y exportan un único esquema (`create-product-schema.ts`
  exporta `createProductSchema`).
- La ruta de cada funcionalidad se exporta como `<name>Routes`.
- Los identificadores nuevos del código se escriben en inglés.

## Pruebas

### Niveles

La clasificación depende de lo que la prueba necesita para ejecutarse, no del nombre del archivo.

| Nivel                | Qué comprueba                                | Qué necesita                          |
| -------------------- | -------------------------------------------- | ------------------------------------- |
| Unitaria             | Una función, esquema, hook o middleware      | Ni la aplicación ni una base de datos |
| De componente        | Un componente o página de React              | jsdom, Testing Library y MSW          |
| De integración       | Varias piezas conectadas, con la aplicación  | La aplicación y, a veces, PostgreSQL  |
| De extremo a extremo | El frontend y la API juntas, en un navegador | Ambas aplicaciones en ejecución       |

Las unitarias existen en el backend, el frontend y los paquetes. Las de componente, solo en el frontend, y las de
integración, solo en el backend. Las de extremo a extremo todavía no existen.

- Una prueba unitaria puede usar el framework real (Nest o React) sin simular sus piezas. Es lo que Fowler llama una
  prueba unitaria _sociable_ ([UnitTest](https://martinfowler.com/bliki/UnitTest.html)): lo que la hace unitaria es que
  no necesita la aplicación completa ni una base de datos.
- Una prueba de integración comprueba que unidades desarrolladas por separado funcionan al conectarse
  ([IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html)).
- «De componente» designa siempre una prueba de React. No es el _component test_ de Fowler, que es cualquier prueba que
  limita su alcance a una parte del sistema ([Software Testing Guide](https://martinfowler.com/testing)). Las pruebas de
  la API que arrancan la aplicación aunque no usen la base de datos, como las de errores o salud, son de integración en
  este proyecto.
- Las pruebas de una página con MSW son de componentes, aunque recorran varios componentes, el enrutado y la caché de
  consultas.

### Ubicación y convenciones

- Las unitarias y las de componentes viven junto al archivo que prueban. En el frontend y los paquetes se nombran
  `<archivo>.test.ts` o `<archivo>.test.tsx` (`fetch-products.test.ts`, `product-form.test.tsx`), y en la API,
  `<archivo>.spec.ts`, la convención de Nest.
- Las de integración viven en `test/<módulo>/` de la aplicación y se nombran `<nombre>.e2e-spec.ts`. Hoy solo existen en
  `apps/api`.
- Lo que una aplicación comparte entre sus pruebas y no es una prueba (la preparación de la base de datos, el servidor
  de MSW) vive en `test/support/` en la API y en `src/test/` en el frontend.
- Cada paquete con pruebas tiene su propio `vitest.config.ts` y su script `test`. `contracts` prueba sus esquemas junto
  a ellos (`src/auth.test.ts`). `database` mantiene sus pruebas en `test/`, y todas usan PostgreSQL.
- Los casos límite de una regla se prueban en unitarias. Las de integración comprueban que las piezas están conectadas y
  que los flujos completos funcionan, no cada combinación de entradas. La proporción sigue la forma de pirámide: muchas
  unitarias y menos pruebas cuanto más amplio es el alcance
  ([The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)).
- `npm test` en la raíz ejecuta las pruebas de todos los workspaces. En la API, `test` ejecuta primero las unitarias y
  después las de integración; `test:unit` y `test:e2e` ejecutan cada nivel por separado, y el primero no necesita
  PostgreSQL. Los comandos están en [Comandos](../guias/general/comandos.md).
- Para escribir una prueba, consulta las guías [Escribir una prueba en el backend](../guias/backend/nueva-prueba.md) y
  [Escribir pruebas en el frontend](../guias/frontend/nueva-funcionalidad/pruebas.md).

### Qué cubre cada nivel en una API REST

- **Unitaria:** las reglas de validación y sus casos límite, las funciones puras, la configuración y cada pieza por
  separado. Por ejemplo, los esquemas de `contracts`, `ContractValidationPipe`, `AllExceptionsFilter`,
  `validateUserFields`, el esquema de entorno y `requestId`.
- **De integración:** el contrato HTTP, los middlewares dentro de la aplicación, la persistencia y los flujos de varios
  pasos. Por ejemplo, los errores públicos, las cabeceras, CORS y CSRF, el registro, el inicio de sesión y la lectura de
  sesión, el esquema de la base frente a Better Auth, la documentación OpenAPI y el cableado con `NODE_ENV=production`.

### Particularidades del backend

- Las pruebas de integración de `apps/api/test/` arrancan la aplicación con `createTestApp`
  (`test/support/test-app.ts`), que monta `AppModule` y aplica `configureApp` igual que `main.ts`, y la llaman con
  Supertest. El cliente de `test/support/test-client.ts` construye las URL con `apiBasePath` y envía `Origin` como un
  navegador.
- Usan una base PostgreSQL real, por lo que comprueban las consultas, los códigos de estado y los cuerpos públicos. Las
  rutas que exigen sesión se prueban con el flujo real: `signUp` registra un usuario y devuelve su cookie, y
  `deleteUsers` elimina los usuarios de cada archivo según su prefijo de correo.
- Para provocar un error que la API no produce, `createTestApp` acepta controladores de prueba que se registran solo en
  esa aplicación.
- `vitest.config.ts` incluye los `*.spec.ts` y no tiene preparación global. `vitest.config.e2e.ts` incluye los
  `*.e2e-spec.ts`, fija `NODE_ENV=development` y deriva la conexión de `DATABASE_URL` hacia `<base>_test` (ver
  [Datos](#datos)).
- `test/support/global-setup.ts` solo corre con la configuración de integración: crea la base de pruebas si no existe y
  aplica las migraciones antes de ejecutarlas, por lo que `npm test` no necesita pasos manuales.
- La preparación rechaza una `DATABASE_URL` que ya termine en `_test`, para no derivar una base de pruebas de otra de
  pruebas. `test/database/ensure-database.e2e-spec.ts` comprueba la creación de la base con una base temporal.
- El límite de peticiones y la CSP solo se activan con `NODE_ENV=production`, por lo que
  `test/common/production.e2e-spec.ts` vuelve a importar la aplicación con ese valor (`createTestApp({ env })`, que usa
  `vi.resetModules()` y `vi.stubEnv()`). Cada prueba empieza con contadores nuevos. Si se quita un middleware de
  `configureApp`, falla una prueba de integración.
- Las pruebas de la documentación hacen lo mismo con otro `NODE_ENV` para comprobar que solo se publica con
  `development` y que responde `404` con `production`, con `test` y sin la variable.
- El esquema de entorno se prueba de forma unitaria con objetos, sin tocar `process.env`, por lo que la prueba no
  depende del `.env` de quien la ejecute. La dirección del cliente no se exporta: se prueba por su efecto, comprobando
  qué peticiones comparten contador.
- `test/database/db-schema.e2e-spec.ts` compara las tablas que Better Auth necesita (`getAuthTables`) con la base
  migrada: columnas, tipos, nulabilidad y claves foráneas, con ids `uuid` y fechas `timestamptz`.
  `test/database/app-schema.e2e-spec.ts` comprueba el esquema de las tablas de la aplicación y el borrado en cascada.
- Bajo Vitest, Better Auth desactiva la comprobación de origen de las peticiones. El rechazo de un origen no confiable
  por parte de la librería (`403 INVALID_ORIGIN`) no puede probarse allí y se comprueba contra la API en ejecución. La
  protección CSRF de la API sí se prueba.
- Cada prueba de integración crea sus propios usuarios y los elimina al terminar, lo que borra también los datos
  asociados.
- **Aislamiento entre archivos.** Todos los archivos de integración comparten una sola base, `<base>_test`, y se
  ejecutan en paralelo. Cada archivo se aísla con un prefijo de correo propio y elimina sus usuarios al terminar. Esto
  funciona mientras los datos de la prueba cuelguen de un usuario. Una prueba que necesita datos globales, sin
  propietario, o que cuenta las filas de toda una tabla, no puede usar este aislamiento y requiere su propia base o
  esquema.
- **Reglas de un servicio.** Las que consultan la base de datos se prueban en integración contra PostgreSQL: las
  consultas viven en el servicio y simular el cliente de Drizzle ataría la prueba a la forma exacta de cada consulta. La
  lógica pura, sin consultas, se prueba de forma unitaria; si depende de otro provider, se sustituye con `useValue` en
  `Test.createTestingModule`, como muestra la guía
  [Escribir una prueba en el backend](../guias/backend/nueva-prueba.md).
- **Guards globales.** `ThrottlerGuard` y `AuthGuard` se registran con `{ provide: APP_GUARD, useClass: ... }`, y ni
  `overrideGuard` ni `overrideProvider` alcanzan a un guard registrado así
  (`.agents/skills/nestjs-testing/references/testing.md`). Por eso no se sustituyen: el límite de peticiones se prueba
  recargando la aplicación con `NODE_ENV=production`, y la sesión, con el flujo real de `signUp`.
- **Código que depende del tiempo.** Se inyecta el reloj o la espera y la prueba los controla, en lugar de dormir en la
  prueba.

### Particularidades del frontend

- **Unitarias (Vitest).** Prueban funciones sin interfaz: las de `api/` y la configuración del cliente de autenticación
  (`lib/`). Los hooks y los esquemas de `schemas/` se prueban igual cuando una funcionalidad los tiene.
- **De componentes (Vitest, React Testing Library y jsdom).** Renderizan un componente o una página y comprueban lo que
  ve y hace el usuario, no su implementación interna. Las peticiones HTTP se simulan con MSW, así que no necesitan la
  API real.
- Qué se prueba en cada capa:
  - `api/`: unitarias, con la API simulada con MSW. Comprueban lo que la función envía, lo que devuelve y cómo traduce
    los errores.
  - `hooks/`: unitarias, o de componentes cuando dependen de la caché de consultas o de la URL.
  - `components/`: de componentes.
  - `layouts/`: de componentes, con un router en memoria y la sesión simulada con `mockSession`. Cubren cada rama:
    sesión, sin sesión, carga y error.
  - `pages/`: de componentes, con MSW para los datos. Renderizan la página dentro de su layout y comprueban el flujo:
    enviar el formulario y la redirección que provoca la sesión nueva.
  - `app/router.tsx`: se prueba con el router real, navegando a cada ruta.
- `src/test/setup.ts` activa MSW al cargarse y no en `beforeAll`, porque el cliente de autenticación captura `fetch` al
  importarse. Con `onUnhandledFrame: "error"`, una petición sin respuesta declarada hace fallar la prueba en lugar de
  salir a la red.
- El estado de sesión del cliente de autenticación es global al módulo. `mockSession` (`src/test/mock-session.ts`)
  declara la respuesta de `get-session` y espera a que el cliente la consulte, para que una prueba no herede el estado
  de la anterior.
- jsdom no implementa `window.matchMedia`, que usan el sidebar y el proveedor del tema. `stubMatchMedia`
  (`src/test/match-media.ts`) lo sustituye en las pruebas que lo necesitan y se deshace con `vi.unstubAllGlobals()`.

### Pruebas de extremo a extremo

Recorren el frontend y la API juntas en un navegador real, y comprueban lo que ninguna otra capa ve: la cookie de sesión
entre recargas, las guardas de ruta y el proxy de Vite. No pertenecen a una sola aplicación. Hoy no existen: el motivo y
la condición para reintroducirlas están en [Riesgos y deuda técnica](./11-riesgos-y-deuda-tecnica.md).
