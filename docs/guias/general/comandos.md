# Comandos

Ejecútalos desde la raíz del repositorio.

- `npm run dev`: inicia la API y el frontend en modo desarrollo.
- `npm run build`: genera los artefactos de la API y del frontend.
- `npm run typecheck`: comprueba los tipos de todos los paquetes.
- `npm run lint`: ejecuta Oxlint en todos los paquetes.
- `npm run lint:md`: ejecuta markdownlint sobre los archivos Markdown.
- `npm run check`: comprueba el formato con Prettier, ejecuta Oxlint y la comprobación de tipos, y ejecuta markdownlint.
  No modifica archivos y se detiene en la primera comprobación que falla.
- `npm test`: ejecuta las pruebas de Vitest de todos los workspaces. Crea la base `<base>_test` si falta.
- `npm run test:unit -w api`: ejecuta solo las pruebas unitarias de la API. No necesita PostgreSQL.
- `npm run test:e2e -w api`: ejecuta solo las pruebas de integración de la API. Crea la base `<base>_test` si falta.
- `npm run db:generate`: genera una migración de Drizzle Kit a partir del esquema. Mientras no haya datos que preservar
  no añadas migraciones: borra `packages/database/migrations/` y ejecuta
  `npm run db:generate -w @autana/database -- --name db_init`. Después reinicia tu base con `npm run db:reset` y elimina
  la base de pruebas `<base>_test`, que `npm test` crea de nuevo.
- `npm run db:migrate`: aplica las migraciones pendientes.
- `npm run db:reset`: deja la base de `DATABASE_URL` vacía y migrada. Pide confirmación.

Para crear la base y definir `<base>`, consulta la [guía de configuración](./configuracion.md).

## Antes de enviar cambios

Ejecuta `npm run check` y `npm test`. Los hooks de Git formatean los archivos preparados y validan el mensaje del
commit.
