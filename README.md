<div align="center">

<img src="docs/assets/autanasoft.png" alt="AutanaSoft" width="320" />

<h1>Autana Nest Full Stack Starter</h1>

<p>Base mínima y tipada para iniciar tu próxima aplicación full stack.</p>

![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green)
![Node.js 26](https://img.shields.io/badge/node-26-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![PostgreSQL 18+](https://img.shields.io/badge/PostgreSQL-18%2B-4169E1?logo=postgresql&logoColor=white)

</div>

Esta es la variante con NestJS. Si prefieres Hono, usa
[Autana Hono Full Stack Starter](https://github.com/AutanaSoft/autana-hono-fullstack-starter).

## Qué incluye

Un monorepo listo para clonar y ampliar, con lo mínimo para que un proyecto nuevo empiece con buenas bases:

- **Autenticación** por correo y contraseña con Better Auth, con protección CSRF y límite de peticiones.
- **API** con NestJS y validación con Zod, con documentación OpenAPI interactiva en `/v1/docs` en desarrollo.
- **Contratos compartidos**: los esquemas Zod se definen una vez y los usan la API y el frontend.
- **Web** con React, React Router, TanStack Query y componentes de shadcn/ui sobre Tailwind CSS 4, con un panel privado.
- **Funcionalidades de ejemplo** (`tasks` y `profile`), de punta a punta, para probar la plantilla al levantar un
  proyecto nuevo. Se retiran con la [guía correspondiente](./docs/guias/general/retirar-funcionalidades-de-ejemplo.md).
- **Base de datos** PostgreSQL con Drizzle ORM, migraciones y un comando para reiniciarla en desarrollo.
- **Pruebas** con Vitest: unitarias y de integración en la API, estas últimas contra una base PostgreSQL real, y
  unitarias y de componentes en el frontend.
- **Calidad** automatizada con Oxlint, Prettier, markdownlint, Husky, lint-staged y commitlint.
- **Documentación** de arquitectura (arc42), guías con ejemplos de código y ejemplos de PRD y plan de implementación.

## Stack

| Capa              | Tecnologías                                               |
| ----------------- | --------------------------------------------------------- |
| Monorepo          | npm workspaces, Turborepo, TypeScript                     |
| Frontend          | React, Vite, React Router, shadcn/ui, Tailwind CSS        |
| Backend           | NestJS, Better Auth, Zod, OpenAPI                         |
| Base de datos     | PostgreSQL, Drizzle ORM                                   |
| Pruebas y calidad | Vitest, Oxlint, Prettier, markdownlint, Husky, commitlint |

Las versiones están en [Restricciones de la arquitectura](./docs/arquitectura/02-restricciones.md).

## Estructura

| Workspace                | Contenido                                                           |
| ------------------------ | ------------------------------------------------------------------- |
| `apps/api`               | Backend con NestJS, Better Auth, Drizzle y PostgreSQL.              |
| `apps/app`               | Frontend con React, React Router y shadcn/ui.                       |
| `packages/contracts`     | Esquemas Zod y constantes compartidos por el backend y el frontend. |
| `packages/database`      | Esquema, migraciones y cliente de Drizzle.                          |
| `packages/ui`            | Componentes base de shadcn/ui.                                      |
| `packages/oxlint-config` | Configuración compartida de Oxlint.                                 |

## Inicio rápido

Necesitas Node.js 26, npm 11 y PostgreSQL 18 o superior.

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
cp apps/app/.env.example apps/app/.env
createdb -h localhost -U postgres autana_dev
npm run db:migrate
npm run dev
```

Antes de arrancar, define `BETTER_AUTH_SECRET` en `apps/api/.env`. El frontend queda en <http://localhost:5173>. Los
detalles están en la [guía de configuración](./docs/guias/general/configuracion.md).

## Documentación

- [Arquitectura](./docs/arquitectura/README.md): decisiones, estructura y reglas del código.
- [Configuración](./docs/guias/general/configuracion.md): variables de entorno y bases de datos.
- [Comandos](./docs/guias/general/comandos.md): scripts del monorepo y comprobaciones previas al envío de cambios.
- [Crear una ruta en el backend](./docs/guias/backend/nueva-ruta.md)
- [Definir una configuración en el backend](./docs/guias/backend/nueva-configuracion.md)
- [Dividir un servicio por responsabilidad](./docs/guias/backend/nuevo-servicio.md)
- [Escribir una prueba en el backend](./docs/guias/backend/nueva-prueba.md)
- [Regenerar y comparar el esquema de Better Auth](./docs/guias/backend/esquema-better-auth.md)
- [Crear una funcionalidad en el frontend](./docs/guias/frontend/nueva-funcionalidad/README.md)
- [Añadir componentes de shadcn/ui](./docs/guias/frontend/componentes-shadcn.md)
- [Retirar las funcionalidades de ejemplo](./docs/guias/general/retirar-funcionalidades-de-ejemplo.md)
- [Requisitos del producto (PRD)](./docs/prd/README.md): cómo documentar un producto, con un ejemplo.
- [Planes de implementación](./docs/plans/README.md): cómo planificar un cambio, con un ejemplo.

## Licencia

[MIT](./LICENSE) © 2026 AutanaSoft.
