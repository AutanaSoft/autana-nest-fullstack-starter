# Decisiones de arquitectura

## Backend

### Decisiones

- **Un módulo de Nest por funcionalidad, con controlador y servicio.** El controlador traduce HTTP y el servicio guarda
  las reglas y las consultas sin conocer HTTP, de modo que cada parte se prueba y se cambia por separado. Alternativa
  descartada: la lógica dentro del controlador.
- **Un servicio por responsabilidad, con la orquestación en el controlador.** Cada servicio se prueba con pocos dobles y
  cambia por una sola razón. El controlador coordina los servicios de un caso de uso sin reglas propias, por lo que no
  hace falta una capa adicional. Alternativas descartadas: un único servicio por módulo con todo dentro, que acaba
  siendo un "servicio de dios", y un servicio orquestador, que añade una capa sin necesidad por ahora.
- **Las consultas viven en el servicio, sin repositorio por defecto.** El cliente de Drizzle ya está tipado y el
  servicio aplica el propietario en el `WHERE`, por lo que una capa de repositorio solo añadiría código. Un repositorio
  que guarda `db` tampoco participa en una transacción abierta con `tx`, salvo que se propague con `AsyncLocalStorage`.
  Se extrae solo una consulta compleja o reutilizada. Alternativa descartada: un repositorio obligatorio por módulo,
  cuyo motivo, poder cambiar de base de datos, es una necesidad hipotética.
- **`common/` organizado por tipo de pieza de Nest, sin archivos sueltos.** Cada pieza transversal se localiza por su
  tipo (`filters/`, `pipes/`, `middleware/`, `decorators/`, `errors/`, `openapi/`) y la carpeta crece sin mezclar
  responsabilidades. Alternativa descartada: una carpeta plana, que mezcla piezas de naturaleza distinta a medida que
  crece.
- **Módulos con el controlador y el módulo en la raíz, y el resto por tipo de pieza.** Las carpetas de tipo usan los
  mismos nombres que `common/` y se crean cuando existe su primera pieza, por lo que un módulo pequeño no arrastra
  carpetas vacías. El repositorio vive en `repositories/` y solo existe si la consulta es compleja o reutilizada.
  Alternativa descartada: una estructura plana por módulo, que obliga a reorganizarlo al crecer.
- **Mappers como funciones tipadas, sin esquema Zod por defecto.** Drizzle ya tipa la fila y el interceptor valida la
  respuesta con el esquema del contrato, por lo que validar la fila duplicaría campos y comprobaciones. Un mapper solo
  usa un esquema cuando su entrada es externa o no tiene forma fija. Alternativa descartada: validar siempre la fila con
  Zod.
- **Los servicios se inyectan por su clase, y un token solo cuando el valor no es una clase.** Una interfaz no existe en
  ejecución y no sirve como token, por lo que crear una interfaz y un token por servicio añadiría una capa sin
  necesidad. El `Symbol` con `@Inject()` se reserva para valores que no son clases o para varias implementaciones
  reales, y las pruebas sustituyen un provider con `useValue` o `overrideProvider`. Alternativa descartada: una interfaz
  y un token por servicio, y elegir la implementación con `process.env`, que se salta la configuración validada de
  `@nestjs/config`.
- **Una base de pruebas compartida, con aislamiento por prefijo de correo.** Todos los archivos de integración usan
  `<base>_test` y cada uno elimina solo los usuarios de su prefijo, por lo que no hay que crear ni migrar una base por
  archivo. Alternativa descartada: una base o un esquema por archivo, que añade creación y migración sin una necesidad
  demostrada. Si una prueba necesita datos globales, ese archivo requiere su propio aislamiento.
- **Los guards globales no se sustituyen en las pruebas.** Un guard registrado con `APP_GUARD` y `useClass` no se puede
  reemplazar con `overrideProvider`, así que el límite de peticiones se prueba recargando la aplicación con
  `NODE_ENV=production` y la sesión, con el flujo real. Alternativa descartada: registrarlos con `useExisting` para
  poder sustituirlos, que cambia el módulo solo para las pruebas.
- **Esquemas Zod en un paquete compartido.** Backend, frontend y pruebas validan con la misma definición y OpenAPI se
  genera de ella.
- **Validación y serialización con Standard Schema, sin clases DTO.** `StandardSchemaValidationPipe` valida las entradas
  y `StandardSchemaSerializerInterceptor` valida y filtra las respuestas con los esquemas del contrato, y los tipos se
  infieren. Alternativa descartada: `class-validator` con DTO, que duplicaría el contrato en clases.
- **Un solo decorador para la respuesta (`@ResponseSchema`).** Declara una vez el esquema que sirve para serializar y
  para documentar, de modo que ambos no pueden desincronizarse.
- **`z.object()` en lugar de `strictObject` o `passthrough` en las respuestas.** El primero convierte un campo adicional
  en `500` y el segundo lo expone.
- **`404` para recursos ajenos.** No revela qué identificadores existen.
- **`WHERE` con propietario y precondición en las mutaciones.** Resuelve las operaciones concurrentes con un `409`.
- **Contratos con `zod` puro y metadatos con `.meta()`.** El paquete compartido solo depende de `zod`, y el generador de
  OpenAPI lee los esquemas de Zod 4 tal cual. Alternativa descartada: importar ayudantes del generador de OpenAPI en los
  contratos, que ataría el frontend a una dependencia del backend.
- **Esquemas de OpenAPI con `id`.** Cada esquema del contrato que se publica se registra una vez con un `id` en el
  registro global de Zod (`openapi-schemas.ts`), por lo que aparece en `components.schemas` y las operaciones lo
  referencian. Alternativa descartada: esquemas en línea repetidos en cada operación.
- **Paquete de contratos sin compilar.** Las fuentes se consumen directamente, igual que el paquete de interfaz, y no
  hay artefactos que sincronizar. Alternativa descartada: compilar a `dist/` y publicar tipos y JavaScript.
- **Extensión `.ts` en los imports relativos de los paquetes sin compilar.** Node.js ejecuta esas fuentes quitando los
  tipos y, en ESM, exige la extensión. `rewriteRelativeImportExtensions` hace que `tsc` también los acepte.
- **Base de datos en un paquete compartido.** El esquema, las migraciones y el cliente viven en `packages/database`, con
  su propio `drizzle.config.ts`, y cualquier workspace puede reutilizarlos sin importar código de la API. Alternativa
  descartada: dejarlos en `apps/api`, que obligaría a otros consumidores a depender de la API.
- **El paquete de base de datos recibe la URL por parámetro.** No importa la configuración de la API, que exige
  variables que el paquete no usa, y cada entorno decide a qué base se conecta.
- **Una configuración por dominio con `registerAs` y una validación global.** Cada dominio declara el esquema de sus
  variables y construye su configuración tipada, y `validateEnv` valida todo el entorno de una vez, por lo que un
  arranque fallido informa de todos los errores. Los servicios inyectan la configuración con su clave y no leen claves
  por texto. Las variables de entorno conservan su nombre y las propias van en `camelCase`. Alternativa descartada: un
  único esquema con `ConfigService`, que mezcla los dominios y no distingue el origen de cada valor.
- **Una sola migración mientras no haya datos que preservar.** Una migración por cambio solo acumula historia sin valor.
  La plantilla la mantiene como `0000_db_init`, se regenera al cambiar el esquema y la base se reinicia con
  `npm run db:reset`. Antes del primer despliegue con datos reales debe volver a migraciones incrementales.
- **Los datos propios del usuario van en tablas aparte de las de Better Auth.** `schema/auth.ts` es el esquema que la
  librería valida, y mezclar columnas propias lo acopla a ella. Se relacionan con `user` por su `id`, con borrado en
  cascada. Alternativa descartada: columnas nuevas en `user` con `additionalFields`.
- **Reinicio de la base con `drop schema` y nueva migración.** Deja la base como recién creada, con el registro de
  migraciones incluido, y comprueba a la vez que las migraciones se aplican desde cero. Alternativa descartada: vaciar
  las tablas con `truncate`, que conserva un esquema obsoleto y no revisa las migraciones.
- **Compilación con SWC y comprobación de tipos aparte.** SWC transforma `src/` y la CLI de Nest lo integra, y
  `tsc --noEmit` comprueba los tipos. Alternativa descartada: empaquetar la API y los paquetes del monorepo en un único
  archivo, que añadiría una herramienta de empaquetado a un framework que ya trae su propia CLI.
- **Cuerpo de error plano, con `requestId` incluido.** Los errores de las rutas de Nest comparten un único esquema, y el
  usuario puede indicar el identificador al reportar un fallo. `error` y `statusCode` se derivan del mismo estado para
  que no se desincronicen. `message` es inglés y fijo por `code`, porque el cliente decide por `code`.
- **Un único filtro de excepciones.** `AllExceptionsFilter` da a todo error de las rutas de Nest, incluidos los de los
  guards y los pipes, el mismo contrato, y los servicios indican el código público de cada operación en la propia
  excepción.
- **Errores de `/v1/auth/*` en la forma nativa de Better Auth.** Better Auth atiende esas rutas como middleware y ningún
  mecanismo suyo alcanza todas las respuestas: `onResponse` de un plugin no ve el `429` del límite de intentos, y
  `hooks.after` tampoco ve el `404` ni el JSON mal formado. Unificarlas exigiría reescribir la respuesta de Node
  (`writeHead`, `write` y `end`), lo que depende de cómo escribe `better-call`. El cliente decide por `code`, que Better
  Auth ya informa, y todas sus respuestas llevan `X-Request-Id`. Alternativa descartada: una capa propia que reescriba
  los errores, como el controlador manual que se eliminó.
- **Esquema de autenticación generado con la CLI de Better Auth, con dos personalizaciones.** Al regenerarlo en un
  archivo temporal, las diferencias se limitan a las fechas con zona horaria, a `defaultNow()` en `updated_at` de
  `session` y `account`, y a lo que cambie Better Auth. Alternativas descartadas: un esquema escrito a mano, que oculta
  lo que cambia Better Auth, y usar la salida tal cual, que crea `timestamp` sin zona horaria.
- **Reglas de la cuenta en el contrato, aplicadas también por el servidor.** El formulario y la API validan con el mismo
  esquema, de modo que llamar a la API directamente no permite saltarse las reglas. Se aplican en los hooks de base de
  datos de Better Auth y no solo en `/sign-up/email`, porque `/update-user` también cambia el nombre. Alternativa
  descartada: validar solo en el formulario.
- **Better Auth con `@thallesp/nestjs-better-auth`.** El paquete monta Better Auth, registra un guard de sesión global y
  aporta `@AllowAnonymous()`, `@Session()` y los hooks con decoradores, de modo que el proyecto no mantiene su propio
  puente entre Nest y Better Auth. Toda ruta exige sesión salvo que se marque lo contrario, de modo que una ruta nueva
  nace protegida. Consecuencia: las rutas `/v1/auth/*` no pasan por los filtros ni por el límite de peticiones de Nest y
  devuelven los errores nativos de Better Auth. Alternativa descartada: un controlador propio que reenvía la petición y
  reescribe los errores.
- **Rol y baneo con el plugin `admin` de Better Auth.** Aporta el rol, el baneo y sus rutas de administración sin código
  propio, y `@Roles()` del paquete de Nest ya lee su campo `role`. Se usan sus permisos por defecto, incluidos los de
  suplantar a un usuario, cambiar su contraseña y borrarlo. Alternativa descartada: un campo `status` propio, que
  obligaría a rechazar el inicio de sesión y a revocar las sesiones a mano; se reconsidera si hacen falta más estados
  que activo y suspendido.
- **Sin caché de servidor y `no-store` en las rutas con datos del usuario.** Evita que el navegador o un proxy guarden
  respuestas privadas.
- **`@nestjs/throttler` para el límite de peticiones.** Es el paquete oficial. Alternativa descartada: uno propio, que
  habría que mantener y probar.
- **Contadores del límite en memoria.** Una sola instancia no necesita infraestructura adicional. Alternativa
  descartada: PostgreSQL como almacén compartido; se reconsidera si hay varias instancias.
- **Límite de peticiones solo en producción.** Evita que el desarrollo y Vitest choquen con el límite, igual que el de
  Better Auth.
- **Registro de peticiones propio.** Un middleware escribe una línea con el `requestId`, el método, la ruta, el estado y
  la duración. Alternativa descartada: un interceptor, que no ve los errores de los middlewares ni de los guards.
- **Protección CSRF integrada de Nest, también en `/v1/auth/*`.** Comprueba `Sec-Fetch-Site` y `Origin` en toda petición
  que cambia estado, sin tokens ni cookies, y `WEB_ORIGIN` es un origen de confianza. Alternativa descartada: un esquema
  de tokens, que exigiría cookies adicionales y cambios en el cliente.
- **Compresión `gzip` con `compression`.** Nest no la incluye y este es el middleware estándar de Express.
- **Documentación solo en desarrollo.** El contrato (OpenAPI y Scalar) y la referencia de autenticación se publican
  únicamente con `NODE_ENV=development`. Con cualquier otro valor, o sin la variable, responden `404`, de modo que un
  despliegue al que le falte `NODE_ENV` no expone el contrato. Alternativa descartada: ocultarla solo con
  `NODE_ENV=production`, que falla abierta.
- **Interfaz de la documentación con Scalar.** `@nestjs/swagger` sigue generando el documento OpenAPI, que Nest sirve en
  `/v1/openapi.json` (`ui: false`), y `@scalar/nestjs-api-reference` monta la interfaz en `/v1/docs` a partir de él. La
  interfaz se carga desde jsDelivr y sus fuentes desde `fonts.scalar.com`, por lo que la documentación necesita conexión
  a internet. Se fija la versión del script (`referenceBundle` en `openapi.config.ts`) para que el código que ejecuta el
  navegador no cambie cuando Scalar publique una nueva; al actualizarla se cambia ese número. Alternativas descartadas:
  Swagger UI, que Nest sirve desde `node_modules`, y alojar la interfaz de Scalar en el propio servidor, que añade una
  dependencia y archivos estáticos para una documentación solo de desarrollo.
- **Pruebas unitarias junto al código y de integración en `test/<módulo>/`, con dos configuraciones de Vitest.** Las
  unitarias se ejecutan en milisegundos y sin PostgreSQL, y el frontend ya colocaba las suyas junto al código. Las de
  integración conservan la preparación de la base de datos, que solo ejecuta su configuración. Alternativa descartada:
  una única configuración con una preparación global, que obliga a toda prueba a depender de la base de datos. La
  distinción sigue las definiciones de [Fowler](https://martinfowler.com/bliki/UnitTest.html) y
  [Microsoft](https://learn.microsoft.com/aspnet/core/test/integration-tests).
- **Cada middleware se prueba aislado y registrado en la aplicación.** La prueba aislada comprueba que la pieza
  funciona; la de integración, con `NODE_ENV=production`, comprueba que `configureApp` la conecta. Alternativa
  descartada: solo probar la pieza, que no detecta que alguien quite su registro.

## Frontend

### Decisiones y alternativas

- **Organizar por funcionalidad.** Mantiene juntos los cambios que se hacen a la vez y evita dependencias ocultas.
  Alternativa descartada: organizar por tipo de archivo.
  [Bulletproof React: estructura del proyecto](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- **Sin archivos `index.ts` que reexportan.** Cada import apunta a su origen. Los barrel files pueden dificultar el tree
  shaking de Vite y degradar el rendimiento. Alternativa descartada: barrel files por carpeta.
  [Bulletproof React: estructura del proyecto](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- **Filtros y página en la URL.** Sobreviven a la recarga y al botón Atrás, y se pueden compartir. Alternativa
  descartada: estado local del componente.
  [React Router: `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)
- **Axios con TanStack Query, y reintentos solo ante fallos transitorios.** Un `4xx` no cambia al repetirlo, y repetirlo
  retrasa el error que ve el usuario. Una respuesta `SESSION_REQUIRED` refresca la sesión para que el panel redirija al
  acceso.
- **Datos del servidor solo en la caché de consultas.** Una única fuente de verdad, sin sincronizar copias. Alternativa
  descartada: copiar los datos a un almacén global.
- **`api/` sin React y hooks que la envuelven.** Las peticiones se prueban y reutilizan sin depender de React.
  Alternativa descartada: peticiones dentro de los hooks o componentes.
- **Un panel como contenedor de las pantallas privadas.** La guarda de sesión, la barra lateral y la cabecera se
  escriben una vez en `features/panel`, y `app/router.tsx` monta bajo él las rutas de cada funcionalidad. Una
  funcionalidad no importa de otra, así que el layout de una no podría compartirse con otra. Alternativa descartada: un
  layout por funcionalidad, que repite la barra lateral.
- **El título de la cabecera sale de `handle` en la ruta.** El panel no importa las funcionalidades para conocer sus
  títulos. Alternativa descartada: una tabla de títulos en el panel, que obliga a editarlo con cada pantalla nueva.
- **Archivos en kebab-case.** Coincide con el CLI de shadcn/ui y con el código existente. Alternativa descartada:
  PascalCase para componentes y camelCase para hooks.
- **Componentes base en un paquete de interfaz compartido.** Varias aplicaciones del monorepo pueden compartir el
  sistema de diseño. Alternativa descartada: copiar los componentes en cada aplicación.
