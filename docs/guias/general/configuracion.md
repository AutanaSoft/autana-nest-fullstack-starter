# Configuración

## Requisitos

- Node.js 26 y npm 11.
- PostgreSQL 18 o superior, accesible desde la máquina de desarrollo, y su cliente para crear la base (`createdb`).

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia el `.env.example` de cada workspace a `.env` en el mismo directorio y ajusta los valores. Los `.env` no se
   versionan.

   Variables de [`apps/api/.env`](../../../apps/api/.env.example):

   - `PORT`: puerto de la API (3000 por defecto).
   - `DATABASE_URL`: conexión a PostgreSQL, por ejemplo `postgres://usuario:clave@localhost:5432/autana_dev`.
   - `BETTER_AUTH_SECRET`: secreto de al menos 32 caracteres, por ejemplo `openssl rand -base64 48`.
   - `BETTER_AUTH_URL`: origen de la API, sin ruta, por ejemplo `http://localhost:3000`.
   - `WEB_ORIGIN`: origen del frontend que acepta la API (opcional, `http://localhost:5173` por defecto).
   - `TRUST_PROXY`: `true` solo detrás de un proxy inverso que añada la IP del cliente a `X-Forwarded-For` (opcional,
     `false` por defecto).
   - `CLIENT_IP_HEADER`: cabecera de la que se toma la IP del cliente para el límite de peticiones de Nest y el de
     intentos de acceso de Better Auth, por ejemplo `CF-Connecting-IP` detrás de Cloudflare (opcional).

   Variable de [`packages/database/.env`](../../../packages/database/.env.example), que usan los comandos `db:*`:

   - `DATABASE_URL`: la misma conexión que en `apps/api/.env`.

   Variables de [`apps/app/.env`](../../../apps/app/.env.example):

   - `API_PROXY_TARGET`: destino del proxy de Vite en desarrollo (opcional, `http://localhost:3000` por defecto). Debe
     coincidir con el origen de la API.
   - `VITE_API_URL`: origen de la API para el frontend (opcional). Déjala vacía si comparten origen; indícala solo si la
     API está en otro dominio del mismo sitio, por ejemplo `https://api.example.com`.

3. Crea la base de datos indicada en `DATABASE_URL` y aplica las migraciones. `<base>` es el nombre con el que termina
   esa URL (`autana_dev` en `apps/api/.env.example`). `createdb` necesita también el host y el usuario de la URL, porque
   por defecto usaría el socket local y tu usuario del sistema:

   ```bash
   createdb -h localhost -U postgres <base>
   npm run db:migrate
   ```

   Si PostgreSQL corre en un contenedor y no tienes el cliente instalado, usa el del contenedor:
   `docker exec <contenedor> createdb -U postgres <base>`.

4. Arranca la API y el frontend:

   ```bash
   npm run dev
   ```

   El frontend queda en <http://localhost:5173> y reenvía `/v1` a la API. En desarrollo, la documentación de la API está
   en `/v1/docs`.

## Base de pruebas

`npm test` y `npm run test:e2e -w api` crean y migran `<base>_test` en el mismo servidor; no hace falta crearla. Los
nombres de las bases se explican en [Datos](../../arquitectura/08-conceptos-transversales.md#datos).
