# Conceptos transversales

## Backend

### Compilación y desarrollo

`apps/api` se compila con SWC mediante la CLI de Nest (`nest build`, con `builder: swc` en `nest-cli.json`) a `dist/`.
SWC no comprueba tipos: `npm run typecheck` ejecuta `tsc --noEmit` aparte.

- **Imports relativos.** El proyecto es ESM con `module: nodenext`, por lo que los imports relativos de la API terminan
  en `.js`.
- **Paquetes del workspace.** SWC no compila `contracts` ni `database`: Node.js ejecuta su fuente
  ([Vista de bloques](./05-vista-de-bloques.md#estructura-de-packagescontracts)). `tsconfig.json` activa
  `rewriteRelativeImportExtensions` para que `tsc` acepte sus imports con extensión `.ts`.
- **Desarrollo.** `npm run dev` lanza, mediante Turborepo, `nest start --watch` en `apps/api` con
  `NODE_ENV=development`, que es lo que activa la documentación.
- **Producción.** `npm run build` genera `dist/` y `npm run start:prod` ejecuta `node dist/main`.
- **Puerto.** `app.config.ts` lee `PORT`, con `3000` si falta o está vacío.

### Responsabilidad de los servicios

Cada servicio se ocupa de un concepto de dominio y cambia por una sola razón. Un módulo puede tener varios, como
`services/<name>.service.ts` y `services/<name>-stats.service.ts`.

- Un servicio se divide cuando su nombre contiene "y" (`<Resource>And<Related>Service`), cuando inyecta dependencias que
  solo usa una parte de sus métodos o cuando sus pruebas necesitan muchos dobles.
- Un caso de uso que coordina varios servicios lo ordena el controlador, que no contiene reglas de negocio.
- La lógica sencilla se queda en su servicio, sin fragmentarla en servicios o funciones auxiliares.
- Las consultas viven en el servicio. Se extraen a un repositorio del módulo solo cuando son complejas o las reutilizan
  varios servicios.

El ejemplo está en la guía [Dividir un servicio por responsabilidad](../guias/backend/nuevo-servicio.md).

### Inyección de dependencias

Un servicio se inyecta por su clase. Un token (`Symbol` con `@Inject()`) se usa solo cuando el valor no es una clase,
como el objeto de la librería de autenticación, o cuando hay varias implementaciones reales; una clase abstracta sirve
como contrato y token a la vez. En las pruebas, un servicio se sustituye con `useValue` u `overrideProvider`.

### Definición de un endpoint

- `@Controller('<name>')` fija la ruta relativa al prefijo `/v1`, que `app.setup.ts` aplica con `setGlobalPrefix`. Los
  parámetros de ruta se escriben con dos puntos (`:resourceId`); OpenAPI los publica con llaves.
- Cada entrada se valida con el esquema de `contracts`: `@Body({ schema })`, `@Query({ schema })` y
  `@Param('<name>', { schema })`. El controlador declara el error público de cada destino con
  `@UsePipes(new ContractValidationPipe({ ... }))`.
- `@ResponseSchema(schema, status)` declara la respuesta correcta: activa la serialización y publica el esquema. Los
  demás estados se declaran con `@ApiBadRequestResponse` y similares, con `standardSchema: errorResponseSchema`. Un
  `DELETE` sin cuerpo responde `204`.
- Las rutas exigen sesión salvo que se marquen con `@AllowAnonymous()`. El controlador recibe la sesión con `@Session()`
  y pasa `session.user.id` al servicio.

El servicio:

1. Limita toda consulta a la cuenta autenticada y lanza `NotFoundException` cuando un recurso es ajeno, para no revelar
   qué identificadores existen.
2. En una mutación, incluye el propietario y la precondición de estado en el `WHERE`. Si una operación concurrente
   impide modificar la fila, lanza `ConflictException` (`409`) con un código propio.
3. Comprueba las reglas que relacionan varios campos de la petición, con el error público de la operación.
4. Devuelve el valor en el tipo del contrato, sin serializarlo.

El ejemplo está en la guía [Definir una ruta en el backend](../guias/backend/nueva-ruta.md).

### Validación y errores

`ContractValidationPipe` convierte un fallo de validación en el error público de la operación según el destino que falló
(`param`, `query` o `body`), que el pipe estándar no informa.

`AllExceptionsFilter` es el único manejador de errores de las rutas de Nest y responde siempre con el cuerpo de
`errorResponseSchema` (`packages/contracts/src/errors.ts`). Las rutas de `/v1/auth/*` no pasan por él
([Ciclo de una petición](./06-vista-de-ejecucion.md#ciclo-de-una-petición)).

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
- `error` y `statusCode` salen del estado HTTP (`createErrorResponse`, en `src/common/errors/error-response.ts`).
- `requestId` es el de la cabecera `X-Request-Id`, para que el usuario pueda indicarlo al reportar un fallo.

| Origen                                    | Estado  | Código                                           |
| ----------------------------------------- | ------- | ------------------------------------------------ |
| Excepción de Nest con `{ code, message }` | La suya | El indicado                                      |
| Otra excepción de Nest                    | La suya | Uno fijo por estado: `BAD_REQUEST`, `HTTP_ERROR` |
| Error inesperado                          | `500`   | `INTERNAL_ERROR`, y se registra en el log        |
| Ruta inexistente bajo `/v1/`              | `404`   | `NOT_FOUND`                                      |
| Ruta inexistente fuera de `/v1/`          | `404`   | Página HTML por defecto de Express               |

- Un error inesperado se registra con su detalle y el `requestId`; la respuesta no lo expone.
- Los códigos fijos por estado son `BAD_REQUEST` (`400`), `NOT_FOUND` (`404`), `UNSUPPORTED_MEDIA_TYPE` (`415`),
  `RATE_LIMITED` (`429`) y `HTTP_ERROR` para el resto. Un JSON malformado responde `400 BAD_REQUEST`, y el `429` del
  límite de peticiones añade `Retry-After: 60`.

### Serialización de respuestas con Zod

`StandardSchemaSerializerInterceptor` es global (`APP_INTERCEPTOR`) y valida y filtra cada respuesta correcta con el
esquema que declara `@ResponseSchema`, para que ningún dato interno llegue al cliente. Una ruta sin esquema se devuelve
tal cual.

- Los campos públicos se declaran con `z.object()` en cada nivel: el interceptor descarta los que el esquema no declara,
  como el propietario de una fila. No se usan `z.strictObject()`, que convierte un campo adicional en un `500`, ni
  `.passthrough()`, que lo deja pasar.
- Si el cuerpo no cumple el esquema, el filtro responde `500 INTERNAL_ERROR` sin exponer el detalle.
- Los mappers (`mappers/`) solo adaptan los tipos que el esquema no convierte, como las fechas, y no filtran campos. Son
  funciones tipadas que no validan una fila de Drizzle. Solo usan un esquema Zod, en `mappers/` y fuera del contrato,
  cuando la entrada es externa o no tiene forma fija, como la respuesta de otro servicio o una columna `jsonb`.

### Autenticación y autorización

- La integración usa `@thallesp/nestjs-better-auth`. `AuthModule.forRootAsync` (`modules/auth/auth.module.ts`) monta
  Better Auth como middleware de Express en `/v1/auth/*` y excluye esa ruta del prefijo global. No se definen rutas de
  autenticación propias ni controladores que las reenvíen.
- `auth.ts` crea la instancia con la configuración validada:
  - `@better-auth/drizzle-adapter` con `advanced.database.generateId: "uuid"`, que delega el id en PostgreSQL.
  - `transaction: true`, para que las escrituras de varias filas, como el registro, sean atómicas.
  - `advanced.database.joins: true`, que ahorra una consulta en cada petición protegida y exige las relaciones de
    `schema/auth.ts` (`userRelations`, `sessionRelations` y `accountRelations`).
  - Correo y contraseña (de 8 a 64 caracteres) y peticiones del origen `WEB_ORIGIN`.
  - `basePath` en `${apiBasePath}/auth`. La URL base del entorno no debe incluir una ruta, porque tendría prioridad; el
    esquema de entorno lo comprueba.
  - El plugin `openAPI` (`/v1/auth/reference`) solo cuando la documentación está activa.
  - `hooks` y `databaseHooks` vacíos, que el paquete necesita para registrar las clases con `@Hook()` y
    `@DatabaseHook()`.
- Las reglas de la cuenta (nombre, correo y contraseña) viven en `packages/contracts/src/auth.ts` y las usan el
  formulario y el servidor. `UserValidationHook` (`@BeforeCreate("user")` y `@BeforeUpdate("user")`) las aplica a todo
  endpoint que crea o modifica un usuario. Guarda los valores normalizados (nombre recortado, correo en minúsculas) y,
  si una regla falla, responde `400` con `INVALID_NAME` o `INVALID_EMAIL` y un `message` fijo. Los límites de la
  contraseña (`passwordLength`) salen del mismo contrato.
- Los errores de `/v1/auth/*` tienen la forma nativa de Better Auth (`{ code, message }`), sin `requestId` ni
  `statusCode`, como documenta `/v1/auth/reference`. El `message` de `VALIDATION_ERROR` incluye el detalle del esquema.
  El cliente del frontend lee `error.code`.
- `AuthGuard` es un guard global (`APP_GUARD`) que deja la sesión en `request.session` y `request.user`. Sin sesión
  responde `401 SESSION_REQUIRED` con un mensaje fijo, que no distingue una cookie ausente, caducada o manipulada.
- Better Auth aplica su propio límite de intentos a `/v1/auth/*`, solo con `NODE_ENV=production`: 3 peticiones cada 10 s
  en `/sign-in`, `/sign-up` y `/change-password`. Toma la IP de `CLIENT_IP_HEADER` si está definida y, si no, de
  `X-Forwarded-For`, con las limitaciones descritas en el [límite de peticiones](#middlewares).
- Con `NODE_ENV=production`, la cookie de sesión lleva `Secure` aunque el proceso reciba `http` de un proxy.
- El plugin `admin` (`admin()` en `auth.ts`, con sus valores por defecto) añade `user.role` (`user` por defecto), el
  baneo (`banned`, `banReason` y `banExpires`) y `session.impersonatedBy`, y sus rutas en `/v1/auth/admin/*`, solo para
  el rol `admin`. Un usuario baneado recibe `403 BANNED_USER` al iniciar sesión y pierde sus sesiones; un baneo vencido
  se levanta en el siguiente inicio de sesión. `@Roles(["admin"])` protege una ruta propia por rol. No hay más roles ni
  un primer administrador: el rol se asigna con SQL directo.

### Middlewares

Los middlewares globales se registran en `configureApp` (`src/app.setup.ts`) y las piezas compartidas viven en
`src/common/middleware/`. Su orden está en [Ciclo de una petición](./06-vista-de-ejecucion.md#ciclo-de-una-petición).

- **Registro.** `requestLogger` escribe una línea por petición con el `requestId`, el método, la ruta, el estado y la
  duración, sin cabeceras ni cuerpos.
- **Cabeceras de seguridad.** `app.useSecurityHeaders()`. Con `NODE_ENV=production` añade una CSP que no permite cargar
  nada (`default-src 'none'`); en otros entornos se omite, porque la documentación carga recursos de un CDN.
- **CORS.** Solo acepta el origen `WEB_ORIGIN`, con `credentials: true`, y expone `X-Request-Id`. Solo interviene si el
  frontend y la API están en orígenes distintos.
- **Compresión.** `compression` comprime con `gzip` las respuestas de más de 1 kB que el cliente acepta.
- **CSRF.** `app.enableCsrfProtection({ trustedOrigins: [WEB_ORIGIN] })`, en todas las rutas, también en `/v1/auth/*`.
  Deja pasar `GET`, `HEAD` y `OPTIONS`. En las demás, rechaza con `403` las que `Sec-Fetch-Site` marca como de otro
  origen o, sin esa cabecera, cuyo `Origin` no coincide con `Host` ni es de confianza. Una petición sin ninguna de las
  dos cabeceras pasa ([Riesgos y deuda técnica](./11-riesgos-y-deuda-tecnica.md)).
- **Límite de peticiones.** `@nestjs/throttler`, solo con `NODE_ENV=production`, para que el desarrollo y las pruebas no
  choquen con él. `RateLimitModule` (`src/common/modules/`) fija un límite global por IP (100 por minuto) y otro para
  las escrituras (20 por minuto). `AppModule` registra `ThrottlerGuard` antes que el guard de sesión. Responde
  `429 RATE_LIMITED`.
  - Con `TRUST_PROXY=true` toma la IP de la última entrada de `X-Forwarded-For`; solo debe activarse detrás de un proxy
    que la añada. Sin proxy esa cabecera es falsificable, y con varios proxies la última entrada es la del más cercano,
    de modo que todos los clientes compartirían contador.
  - Con `CLIENT_IP_HEADER` (por ejemplo `CF-Connecting-IP` detrás de Cloudflare) toma la IP de esa cabecera o, si la
    petición no la trae, de la conexión. Solo es fiable si el proxy la sobrescribe siempre y el servidor no acepta
    tráfico que no pase por él.

### Caché

No hay caché de servidor. Las rutas con datos del usuario añaden `Cache-Control: no-store` para que ni el navegador ni
un proxy las guarden: el módulo registra el middleware `noStore` (`src/common/middleware/no-store.middleware.ts`) en
`configure(consumer)`, y la librería de autenticación lo añade a las suyas. Los middlewares del módulo se ejecutan antes
que el guard de sesión, por lo que `noStore` también alcanza al `401`.

### Salud de la API

`src/modules/health/` usa `@nestjs/terminus` y expone tres rutas, todas con `noStore`:

| Ruta                   | Acceso     | Comprueba                                         |
| ---------------------- | ---------- | ------------------------------------------------- |
| `GET /v1/health/live`  | Público    | Nada: es el liveness del orquestador              |
| `GET /v1/health/ready` | Público    | La base de datos: es el readiness del orquestador |
| `GET /v1/health`       | Con sesión | Base de datos, memoria (heap y RSS) y disco       |

- El detalle lo consume la página de estado del frontend, y las pruebas de integración lo usan como ruta protegida.
- La respuesta sigue el formato de Terminus (`status`, `info`, `error` y `details`), descrito en el contrato
  `packages/contracts/src/health.ts`. Con algún indicador caído responde `503` con ese mismo cuerpo, no con el contrato
  de error: el controlador captura la excepción de Terminus antes de que llegue a `AllExceptionsFilter`.
- Terminus no incluye un indicador para Drizzle. `indicators/database.health.ts` ejecuta `select 1` con un tiempo límite
  de 1 s.
- Los umbrales (512 MB de heap, 1 GB de RSS y el 90 % del disco en `/`) son constantes de `health.controller.ts`. Deben
  ajustarse a los recursos del despliegue; en contenedores o en Windows, la ruta del disco puede ser otra.

### Datos

- **Nombres de las bases.** `DATABASE_URL` es la única variable de conexión y apunta a la base de desarrollo, `<base>`.
  Las pruebas usan `<base>_test` en el mismo servidor, por lo que ningún archivo escribe un nombre fijo.
- `packages/database/src/schema/<name>.ts` define las tablas de cada módulo, y
  `apps/api/src/database/database.module.ts` registra el cliente de Drizzle con `@nestjs/drizzle` a partir de
  `createDatabase`. El módulo cierra el pool al apagar la aplicación, porque `main.ts` activa los hooks de cierre.
- Las migraciones se generan con `npm run db:generate` y se aplican con `npm run db:migrate`, con el `DATABASE_URL` de
  `packages/database/.env`. Hay una sola, `0000_db_init`, que se regenera al cambiar el esquema
  ([Comandos](../guias/general/comandos.md)).
- `npm run db:reset` deja la base como recién creada: en una transacción elimina los esquemas `public` y `drizzle`,
  recrea `public` y aplica las migraciones. Exige, sin forma de omitirlo, escribir el nombre de la base y `yes`, y
  `resetDatabase` se niega con `NODE_ENV=production` o con un nombre de base no válido. Si se añade una extensión de
  PostgreSQL, debe recrearse en `reset.ts`. Sus pruebas usan una base temporal propia.
- Los identificadores son `uuid` generados por PostgreSQL (`pg_catalog.gen_random_uuid()`) y las fechas, `timestamptz`.
- `packages/database/src/schema/auth.ts` define las tablas de Better Auth (`user`, `session`, `account` y
  `verification`, con las columnas del plugin `admin`). Lo genera la CLI de Better Auth con dos personalizaciones: las
  fechas son `timestamptz` y `updated_at` de `session` y `account` tiene `defaultNow()`. La guía
  [Regenerar y comparar el esquema de Better Auth](../guias/backend/esquema-better-auth.md) explica cómo actualizarlo.
  Fuera de producción, Better Auth comprueba que el esquema coincide con lo que necesita (`validateSchema`).

### Configuración y entornos

- Cada dominio tiene su archivo `src/config/<name>.config.ts` con el esquema de sus variables, una función `build` que
  lo valida y devuelve la configuración, y su registro con `registerAs`. Exporta un solo tipo, derivado de `build`. Las
  variables de entorno y las propias se nombran como indica el [Glosario](./12-glosario.md). La guía
  [Definir una configuración](../guias/backend/nueva-configuracion.md) muestra el patrón.
- `validateEnv` (`src/config/env.validation.ts`) valida todo el entorno al arrancar y detiene el proceso nombrando cada
  variable inválida. Los servicios inyectan `<name>Config.KEY` y no leen `process.env`.
- Una variable que leen varios dominios se declara en cada uno con la misma definición, porque `validateEnv` se queda
  con la última. `env.validation.spec.ts` comprueba que todas se comportan igual con un conjunto fijo de valores.
- Cada variable nueva se documenta en el `.env.example` de su workspace y en
  [Configuración](../guias/general/configuracion.md). Una prueba comprueba que las variables de la API coinciden con su
  `.env.example`, salvo `NODE_ENV`.
- Cada workspace tiene su `.env` sin versionar (`apps/api`, `apps/app` y `packages/database`) y un `.env.example`
  versionado, sin secretos, que sirve de plantilla. El `.env` se carga solo si existe, y una variable definida en el
  entorno prevalece sobre él.
  - `ConfigModule` usa una ruta relativa al directorio de ejecución, por lo que los scripts de la API se ejecutan desde
    `apps/api`. `vitest.config.e2e.ts` lee el `.env` con `loadEnv` y lo pasa a las pruebas mediante `test.env`.
  - `packages/database/drizzle.config.ts` no usa `import.meta.dirname`, que no existe cuando Drizzle Kit carga el
    archivo como CommonJS.
  - El frontend lo lee con `loadEnv` y el `envDir` de Vite. Su proxy de desarrollo usa `API_PROXY_TARGET`, sin depender
    de variables de la API.
- En producción no hay `.env`: el despliegue define las variables, incluida `NODE_ENV=production`.

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
- Las páginas de acceso no navegan al terminar: redirige `AuthLayout` cuando la sesión ya existe. Si navegaran de
  inmediato, `PanelLayout` leería una sesión sin refrescar y volvería a enviar al acceso.
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
- **Rendimiento:** el panel y cada funcionalidad protegida se declaran con `lazy` en su `routes.tsx`, de modo que cada
  pantalla se descarga al entrar en ella y la primera carga solo incluye el núcleo.

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
integración, solo en el backend. Las de extremo a extremo todavía no existen. Las definiciones están en el
[Glosario](./12-glosario.md).

- Una prueba de la API que arranca la aplicación es de integración aunque no use la base de datos, como las de errores o
  salud.
- Una prueba de una página con MSW es de componente, aunque recorra varios componentes, el enrutado y la caché de
  consultas.

### Ubicación y convenciones

- Las unitarias y las de componentes viven junto al archivo que prueban. En el frontend y los paquetes se nombran
  `<archivo>.test.ts` o `<archivo>.test.tsx` (`fetch-products.test.ts`, `product-form.test.tsx`), y en la API,
  `<archivo>.spec.ts`, la convención de Nest.
- Las de integración viven en `apps/api/test/<módulo>/` y se nombran `<nombre>.e2e-spec.ts`.
- Un workspace tiene pruebas cuando contiene lógica propia: `api`, `app`, `contracts` y `database`. `ui` no las tiene,
  porque son los componentes que genera shadcn/ui, que se prueban a través del frontend, ni `oxlint-config`, que solo
  contiene configuración.
- Cada workspace con pruebas tiene su propio `vitest.config.ts` y su script `test`. `contracts` prueba sus esquemas
  junto a ellos (`src/auth.test.ts`). `database` mantiene sus pruebas en `test/`, y todas usan PostgreSQL.
- Los casos límite de una regla se prueban en unitarias. Las de integración comprueban que las piezas están conectadas y
  que los flujos completos funcionan, no cada combinación de entradas. La proporción sigue la forma de pirámide: muchas
  unitarias y menos pruebas cuanto más amplio es el alcance
  ([The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)).
- `npm test` en la raíz ejecuta las pruebas de todos los workspaces. En la API, `test` ejecuta primero las unitarias y
  después las de integración; `test:unit` y `test:e2e` ejecutan cada nivel por separado, y el primero no necesita
  PostgreSQL. Los comandos están en [Comandos](../guias/general/comandos.md).
- Para escribir una prueba, consulta las guías [Escribir una prueba en el backend](../guias/backend/nueva-prueba.md) y
  [Escribir pruebas en el frontend](../guias/frontend/nueva-funcionalidad/pruebas.md).

### Cobertura

Cada configuración de Vitest mide la cobertura de `src/` en cada ejecución (`coverage.enabled`), con
`@vitest/coverage-v8`, y falla si alguna métrica baja de su umbral (`coverage.thresholds`). Por eso `npm test` la exige
en el hook `pre-push` y en la integración continua.

- Se excluyen las pruebas y los puntos de entrada (`main.ts`, `main.tsx` y `scripts/` de `database`). `database` excluye
  también `schema/`, que cubren las pruebas de la API.
- El resumen se muestra en la terminal y el informe HTML se escribe en `.coverage/<workspace>/`, en la raíz y sin
  versionar. La API mide cada nivel por separado (`.coverage/api/unit` y `.coverage/api/e2e`).
- Todas las configuraciones usan el mismo umbral: 80 % en sentencias, funciones y líneas, y 75 % en ramas. La
  configuración unitaria de la API no tiene umbral, porque los servicios que consultan la base se prueban en
  integración.

### Qué cubre cada nivel en una API REST

- **Unitaria:** las reglas de validación y sus casos límite, las funciones puras, la configuración y cada pieza por
  separado. Por ejemplo, los esquemas de `contracts`, `ContractValidationPipe`, `AllExceptionsFilter`,
  `validateUserFields`, el esquema de entorno y `requestId`.
- **De integración:** el contrato HTTP, los middlewares dentro de la aplicación, la persistencia y los flujos de varios
  pasos. Por ejemplo, los errores públicos, las cabeceras, CORS y CSRF, el registro, el inicio de sesión y la lectura de
  sesión, el esquema de la base frente a Better Auth, la documentación OpenAPI y el cableado con `NODE_ENV=production`.

### Particularidades del backend

- Las pruebas de integración arrancan la aplicación con `createTestApp` (`test/support/test-app.ts`), que monta
  `AppModule` y aplica `configureApp` igual que `main.ts`, contra una base PostgreSQL real. Las rutas con sesión se
  prueban con el flujo real de registro. La guía [Escribir una prueba en el backend](../guias/backend/nueva-prueba.md)
  muestra el cliente, `signUp`, `deleteUsers` y los controladores de prueba.
- `vitest.config.ts` incluye los `*.spec.ts`, sin preparación global. `vitest.config.e2e.ts` incluye los
  `*.e2e-spec.ts`, fija `NODE_ENV=development` y deriva la conexión hacia `<base>_test`. Su preparación
  (`test/support/global-setup.ts`) crea esa base si no existe y aplica las migraciones, y rechaza una `DATABASE_URL` que
  ya termine en `_test`. `test/database/ensure-database.e2e-spec.ts` lo comprueba con una base temporal.
- El comportamiento que depende de `NODE_ENV`, como el límite de peticiones, la CSP o la documentación, se prueba
  volviendo a importar la aplicación con `createTestApp({ env })` (`vi.resetModules()` y `vi.stubEnv()`), con contadores
  nuevos en cada prueba. Si se quita un middleware de `configureApp`, falla una prueba de integración.
- La dirección del cliente para el límite no se exporta: se prueba comprobando qué peticiones comparten contador.
- `test/database/db-schema.e2e-spec.ts` compara las tablas que Better Auth necesita (`getAuthTables`) con la base
  migrada, y `test/database/app-schema.e2e-spec.ts`, las tablas de la aplicación y el borrado en cascada.
- Bajo Vitest, Better Auth desactiva su comprobación de origen, así que `403 INVALID_ORIGIN` no se prueba allí
  ([Riesgos](./11-riesgos-y-deuda-tecnica.md#riesgos)). La protección CSRF de la API sí se prueba.
- **Aislamiento entre archivos.** Los archivos de integración se ejecutan en paralelo contra la misma base. Cada uno usa
  un prefijo de correo propio, que no empieza por el de otro archivo, y elimina sus usuarios al terminar, lo que borra
  sus datos. Una prueba con datos sin propietario, o que cuenta las filas de toda una tabla, necesita su propia base o
  esquema.
- **Reglas de un servicio.** Las que consultan la base se prueban en integración: simular el cliente de Drizzle ataría
  la prueba a la forma de cada consulta. La lógica pura se prueba de forma unitaria, sustituyendo otros providers con
  `useValue`.
- **Guards globales.** `ThrottlerGuard` y `AuthGuard` se registran con `{ provide: APP_GUARD, useClass: ... }`, que
  `overrideGuard` y `overrideProvider` no alcanzan (`.agents/skills/nestjs-testing/references/testing.md`). No se
  sustituyen: el límite se prueba recargando la aplicación con `NODE_ENV=production` y la sesión, con el registro real.
- **Código que depende del tiempo.** Se inyecta el reloj o la espera y la prueba los controla, en lugar de dormir.

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

### Integración continua

`.github/workflows/ci.yml` se ejecuta en cada pull request y en cada push a `main`, con Node 26, y cancela la ejecución
anterior de la misma rama. Tiene dos trabajos:

- **Formato, lint y tipos:** `npm ci`, `npm run check` y `npm run build`. Compilar evita que un cambio que pasa las
  pruebas deje la API o el frontend sin poder construirse.
- **Pruebas:** levanta PostgreSQL 18 como servicio, copia los `.env.example` de `apps/api` y `packages/database` a
  `.env` y ejecuta `npm test`. Turborepo solo pasa a las tareas las variables declaradas en `turbo.json`, por lo que las
  pruebas leen su entorno de esos `.env`.

Además, GitHub ejecuta el análisis de CodeQL en los pull requests.

Los hooks de Husky repiten esas comprobaciones en local: `pre-commit` ejecuta `lint-staged` sobre los archivos
preparados, `commit-msg` valida el mensaje con commitlint y `pre-push` ejecuta `npm run check` y `npm test`, por lo que
necesita PostgreSQL en marcha. Se pueden omitir con `--no-verify`; la integración continua es la barrera que no.

### Pruebas de extremo a extremo

Recorren el frontend y la API juntas en un navegador real, y comprueban lo que ninguna otra capa ve: la cookie de sesión
entre recargas, las guardas de ruta y el proxy de Vite. No pertenecen a una sola aplicación. Hoy no existen: el motivo y
la condición para reintroducirlas están en [Riesgos y deuda técnica](./11-riesgos-y-deuda-tecnica.md).
