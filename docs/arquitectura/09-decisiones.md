# Decisiones de arquitectura

Cada entrada recoge una decisión, su motivo y la alternativa descartada. Los principios generales están en
[Estrategia de solución](./04-estrategia-de-solucion.md) y las reglas que resultan, en
[Conceptos transversales](./08-conceptos-transversales.md).

## Backend

### Organización del código

- **Un módulo de Nest por funcionalidad, con controlador y servicio.** El controlador traduce HTTP y el servicio no lo
  conoce, de modo que cada parte se prueba y se cambia por separado. Descartado: la lógica dentro del controlador.
- **Un servicio por responsabilidad, con la orquestación en el controlador.** Cada servicio se prueba con pocos dobles y
  cambia por una sola razón. Descartados: un único servicio por módulo, que acaba siendo un "servicio de dios", y un
  servicio orquestador, una capa sin necesidad por ahora.
- **Las consultas viven en el servicio, sin repositorio por defecto.** El cliente de Drizzle ya está tipado, y un
  repositorio que guarda `db` no participa en una transacción abierta con `tx` salvo que se propague con
  `AsyncLocalStorage`. Descartado: un repositorio obligatorio por módulo para poder cambiar de base de datos, una
  necesidad hipotética.
- **Piezas agrupadas por tipo de Nest, en `common/` y en cada módulo.** Cada pieza se localiza por su tipo y las
  carpetas se crean con su primera pieza, por lo que un módulo pequeño no arrastra carpetas vacías. Descartado: carpetas
  planas, que mezclan piezas distintas al crecer.
- **Mappers como funciones tipadas, sin esquema Zod por defecto.** Drizzle ya tipa la fila y el interceptor valida la
  respuesta, por lo que validar la fila duplicaría comprobaciones. Descartado: validar siempre la fila con Zod.
- **Los servicios se inyectan por su clase.** Una interfaz no existe en ejecución y no sirve como token. Descartado: una
  interfaz y un token por servicio, eligiendo la implementación con `process.env`, que se salta la configuración
  validada.

### Contrato, validación y errores

- **Esquemas Zod en un paquete compartido.** Backend, frontend y pruebas validan con la misma definición y OpenAPI se
  genera de ella.
- **Standard Schema, sin clases DTO.** Los pipes y el interceptor validan con los esquemas del contrato y los tipos se
  infieren. Descartado: `class-validator` con DTO, que duplicaría el contrato en clases.
- **Un solo decorador para la respuesta (`@ResponseSchema`).** El mismo esquema serializa y documenta, de modo que no
  pueden desincronizarse.
- **Contratos con `zod` puro y metadatos con `.meta()`.** El paquete solo depende de `zod` y el generador de OpenAPI lee
  los esquemas de Zod 4 tal cual. Descartado: ayudantes del generador en los contratos, que atarían el frontend a una
  dependencia del backend.
- **Esquemas de OpenAPI con `id`.** Cada esquema publicado se registra una vez en el registro global de Zod
  (`openapi-schemas.ts`) y las operaciones lo referencian. Descartado: esquemas en línea repetidos en cada operación.
- **Cuerpo de error plano, con `requestId`.** Un único esquema para todos los errores de Nest, con el identificador que
  el usuario puede reportar. `message` es fijo por `code` porque el cliente decide por `code`.
- **Un único filtro de excepciones.** Todo error de las rutas de Nest, incluidos los de guards y pipes, sigue el mismo
  contrato, y cada servicio indica su código público en la excepción.
- **Errores de `/v1/auth/*` en la forma nativa de Better Auth.** Ningún punto de extensión de Better Auth alcanza todas
  sus respuestas (`onResponse` no ve el `429`, ni `hooks.after` el `404` o el JSON mal formado), y unificarlas exigiría
  reescribir la respuesta de Node. El cliente decide por `code`, que Better Auth ya informa. Descartado: una capa propia
  que reescriba los errores ([deuda técnica](./11-riesgos-y-deuda-tecnica.md#deuda-técnica)).

### Paquetes y datos

- **Paquetes del monorepo sin compilar.** Las fuentes se consumen directamente, como el paquete de interfaz, y no hay
  artefactos que sincronizar. Node.js exige la extensión `.ts` en sus imports relativos. Descartado: compilar a `dist/`.
- **Base de datos en un paquete que recibe la URL por parámetro.** Cualquier workspace reutiliza el esquema, las
  migraciones y el cliente sin depender de la API ni de su configuración. Descartado: dejarlos en `apps/api`.
- **Una configuración por dominio con `registerAs` y una validación global.** Un arranque fallido informa de todos los
  errores, los servicios inyectan su configuración tipada y el nombre indica el origen de cada valor. Descartado: un
  único esquema con `ConfigService`, que mezcla los dominios.
- **Una sola migración mientras no haya datos que preservar.** Una migración por cambio solo acumula historia sin valor
  ([deuda técnica](./11-riesgos-y-deuda-tecnica.md#deuda-técnica)).
- **Los datos propios del usuario van en tablas aparte de las de Better Auth.** Mezclar columnas propias en el esquema
  que valida la librería lo acopla a ella. Se relacionan con `user` por su `id`, con borrado en cascada. Descartado:
  columnas nuevas en `user` con `additionalFields`.
- **Reinicio de la base con `drop schema` y nueva migración.** Deja la base como recién creada y comprueba a la vez que
  las migraciones se aplican desde cero. Descartado: `truncate`, que conserva un esquema obsoleto.
- **Esquema de autenticación generado con la CLI de Better Auth.** Al regenerarlo, las diferencias se limitan a las dos
  personalizaciones y a lo que cambie Better Auth. Descartados: un esquema escrito a mano, que oculta esos cambios, y la
  salida tal cual, que crea `timestamp` sin zona horaria.
- **Salud con `@nestjs/terminus` y un indicador propio para Drizzle.** Es el paquete oficial y aporta los indicadores de
  memoria y disco y el formato de respuesta; el indicador de la base de datos es una consulta mínima. Descartado: un
  endpoint de salud propio, que duplicaría lo que Terminus ya resuelve.
- **Compilación con SWC y comprobación de tipos aparte.** La CLI de Nest ya integra SWC. Descartado: empaquetar la API y
  los paquetes en un único archivo, que añadiría otra herramienta.

### Autenticación y seguridad

- **Better Auth con `@thallesp/nestjs-better-auth`.** El paquete aporta el montaje, el guard de sesión global y los
  decoradores, y el proyecto no mantiene su propio puente. Toda ruta nace protegida. Descartado: un controlador propio
  que reenvía la petición y reescribe los errores.
- **Reglas de la cuenta en el contrato, aplicadas también por el servidor.** Llamar a la API directamente no permite
  saltarse las reglas. Se aplican en los hooks de base de datos porque `/update-user` también cambia el nombre.
  Descartado: validar solo en el formulario.
- **Rol y baneo con el plugin `admin`.** Aporta el rol, el baneo y sus rutas sin código propio, y `@Roles()` ya lee su
  campo `role`. Se aceptan sus permisos por defecto, incluidos suplantar, cambiar la contraseña y borrar un usuario.
  Descartado: un campo `status` propio, que obligaría a rechazar el acceso y revocar sesiones a mano; se reconsidera si
  hacen falta más estados que activo y suspendido.
- **`@nestjs/throttler` con contadores en memoria.** Es el paquete oficial y una sola instancia no necesita
  infraestructura. Descartado: un límite propio o PostgreSQL como almacén; este se reconsidera con varias instancias.
- **Registro de peticiones con un middleware propio.** Descartado: un interceptor, que no ve los errores de los
  middlewares ni de los guards.
- **Protección CSRF integrada de Nest, también en `/v1/auth/*`.** No necesita tokens ni cookies. Descartado: un esquema
  de tokens, que exigiría cookies adicionales y cambios en el cliente.
- **Detalle de la salud solo con sesión.** El uso de memoria y disco describe la infraestructura, y el orquestador solo
  necesita `live` y `ready`, que son públicas. Ser la única ruta propia de la base con sesión la convierte además en la
  ruta protegida de las pruebas de integración. Descartado: un detalle público.
- **El `503` de la salud conserva el formato de Terminus.** El cliente necesita saber qué indicador falla, y el contrato
  de error solo tiene un código y un mensaje. Descartado: dejar que `AllExceptionsFilter` lo sustituya.
- **Documentación solo con `NODE_ENV=development`.** Un despliegue al que le falte `NODE_ENV` no expone el contrato.
  Descartado: ocultarla solo con `NODE_ENV=production`, que falla abierta.
- **Interfaz de la documentación con Scalar.** `@nestjs/swagger` genera el documento y `@scalar/nestjs-api-reference`
  monta la interfaz desde un CDN, con la versión fijada en `referenceBundle` (`openapi.config.ts`) para que no cambie
  sola. Descartados: Swagger UI, y alojar Scalar en el servidor, que añade archivos estáticos para una documentación de
  desarrollo.

### Pruebas

- **Unitarias junto al código e integración en `test/<módulo>/`, con dos configuraciones de Vitest.** Las unitarias no
  necesitan PostgreSQL y solo la configuración de integración prepara la base. Descartado: una única configuración con
  preparación global, que hace depender toda prueba de la base. Sigue las definiciones de
  [Fowler](https://martinfowler.com/bliki/UnitTest.html) y
  [Microsoft](https://learn.microsoft.com/aspnet/core/test/integration-tests).
- **Una base de pruebas compartida, con aislamiento por prefijo de correo.** No hay que crear ni migrar una base por
  archivo. Descartado: una base o un esquema por archivo, sin una necesidad demostrada.
- **Un umbral de cobertura común, en la configuración de Vitest: 80 % en sentencias, funciones y líneas, y 75 % en
  ramas.** Está entre el 75 % «encomiable» y el 90 % «ejemplar» que propone
  [Google](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html), y en el 80 % que exige
  [SonarQube](https://docs.sonarsource.com/sonarqube-server/2025.4/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates)
  al código nuevo; las ramas, más difíciles de cubrir, tienen el valor más bajo. Deja margen sobre la cobertura actual y
  no depende del código de ejemplo. `npm test` lo aplica igual en el hook y en la CI. Descartados: fijar como umbral la
  cobertura actual, que falla con cualquier cambio pequeño, y un script de cobertura aparte, que podría no ejecutarse.
- **Los guards globales no se sustituyen en las pruebas.** Descartado: registrarlos con `useExisting` para poder
  sustituirlos, que cambia el módulo solo para las pruebas.
- **Cada middleware se prueba aislado y registrado en la aplicación.** La prueba aislada comprueba la pieza y la de
  integración, que `configureApp` la conecta. Descartado: probar solo la pieza, que no detecta que alguien quite su
  registro.

## Frontend

- **Organizar por funcionalidad.** Mantiene juntos los cambios que se hacen a la vez y evita dependencias ocultas.
  Descartado: organizar por tipo de archivo.
  [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- **Sin archivos `index.ts` que reexportan.** Cada import apunta a su origen, y los barrel files pueden dificultar el
  tree shaking de Vite. Descartado: barrel files por carpeta.
- **Filtros y página en la URL.** Sobreviven a la recarga y al botón Atrás, y se pueden compartir. Descartado: estado
  local del componente.
- **Axios con TanStack Query, y reintentos solo ante fallos transitorios.** Repetir un `4xx` no cambia el resultado y
  retrasa el error que ve el usuario.
- **Datos del servidor solo en la caché de consultas.** Una única fuente de verdad. Descartado: copiarlos a un almacén
  global.
- **`api/` sin React y hooks que la envuelven.** Las peticiones se prueban y reutilizan sin React. Descartado:
  peticiones dentro de hooks o componentes.
- **Un panel como contenedor de las pantallas privadas.** La guarda de sesión, la barra lateral y la cabecera se
  escriben una vez, y como una funcionalidad no importa de otra, el layout de una no podría compartirse. Descartado: un
  layout por funcionalidad, que repite la barra lateral.
- **El título de la cabecera sale de `handle` en la ruta.** El panel no importa las funcionalidades. Descartado: una
  tabla de títulos en el panel, que obliga a editarlo con cada pantalla.
- **Componentes base en un paquete de interfaz compartido.** Varias aplicaciones pueden compartir el sistema de diseño.
  Descartado: copiar los componentes en cada aplicación.
