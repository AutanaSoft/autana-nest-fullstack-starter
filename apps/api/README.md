# API

Backend de la aplicación, construido con NestJS 12. Expone las rutas bajo el prefijo `/v1`, con los contratos de
`@autana/contracts`, la base de datos de `@autana/database` y la autenticación de Better Auth. Consulta la arquitectura
en [`docs/arquitectura/`](../../docs/arquitectura/README.md).

## Estructura

Cada funcionalidad es un módulo en `src/modules/`: `auth`, `health`, `profile` y `tasks`. Lo transversal está en
`src/common/` (filtro de errores, middlewares, validación) y la configuración de la aplicación en `src/app.setup.ts`.

## Comandos

Ejecuta los comandos desde la raíz del repositorio con `-w api`, o desde este directorio.

- `npm run dev`: compila con SWC, arranca la API y la reinicia al cambiar el código (`nest start --watch`). Escucha en
  el puerto de `PORT` (3000 por defecto), por ejemplo <http://localhost:3000>.
- `npm run build`: compila con SWC (`nest build`) a `dist/`. SWC no comprueba tipos.
- `npm run start:prod`: ejecuta el resultado de `npm run build`.
- `npm run typecheck`: comprueba los tipos sin generar código.
- `npm test`: ejecuta las pruebas unitarias y después las de integración. Crea la base `<base>_test` si no existe y
  aplica las migraciones.
- `npm run test:unit`: ejecuta solo las unitarias, que no necesitan PostgreSQL.
- `npm run test:e2e`: ejecuta solo las de integración, un directorio por módulo en `test/`.

## Paquetes del workspace

`@autana/contracts` y `@autana/database` se distribuyen como fuente TypeScript. SWC no los compila: Node ejecuta esos
archivos quitando los tipos, por lo que sus imports relativos llevan la extensión `.ts` y `tsconfig.json` activa
`rewriteRelativeImportExtensions` para que `tsc` los acepte.

## Configuración

Copia `.env.example` a `.env` en este directorio y ajusta los valores. La API necesita una base PostgreSQL accesible en
`DATABASE_URL`: crea la base y aplica las migraciones con `npm run db:migrate` antes de arrancar.
