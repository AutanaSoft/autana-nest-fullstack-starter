# Contexto y alcance

## Backend

### Contexto en el monorepo

El repositorio es un monorepo con workspaces de npm y Turborepo. El backend es una aplicación desplegable (`apps/api`)
que depende de paquetes internos (`packages/*`).

```text
apps/
├── api/              # Backend
└── app/              # Frontend
packages/
├── contracts/        # Esquemas Zod compartidos
├── database/         # Esquema, migraciones y cliente de la base de datos
├── ui/               # Componentes base de shadcn/ui
└── oxlint-config/    # Configuración compartida de Oxlint
```

- Una aplicación solo depende de paquetes, nunca de otra aplicación. El backend y el frontend se comunican por HTTP y
  comparten únicamente el paquete de contratos.
- `packages/contracts` publica los esquemas de peticiones y respuestas que consume el frontend, y el prefijo de la API
  (`apiBasePath`, `/v1`). El paquete no depende del backend. Cada módulo exporta su archivo con el patrón
  `packages/contracts/src/<name>.ts` y se importa como `@autana/contracts/<name>`.
- Los esquemas que el frontend no consume, y que comparten varias rutas de un módulo, viven en el propio módulo
  (`modules/<name>/`).
- Cómo consume el backend los paquetes del monorepo, que se distribuyen sin compilar, está en
  [Vista de bloques](./05-vista-de-bloques.md#estructura-de-packagescontracts).

### Contrato HTTP y OpenAPI

NestJS publica el documento OpenAPI en `/v1/openapi.json` y la interfaz de Scalar en `/v1/docs`. La librería de
autenticación publica su propia referencia en `/v1/auth/reference`. El documento se genera a partir de los controladores
y de los esquemas Zod del paquete de contratos, que se publican una sola vez en `components.schemas` y se referencian
desde cada operación.

Solo con `NODE_ENV=development` se publican el documento, la interfaz de Scalar y la referencia de la librería de
autenticación. Con cualquier otro valor, o sin la variable, las tres rutas responden `404` y el resto de la API sigue
disponible.

## Frontend

### Relación con el monorepo

- Los componentes base de shadcn/ui viven en un paquete de interfaz compartido del monorepo, no en la aplicación. La
  aplicación los importa por su ruta de paquete (`@autana/ui/components/<componente>`).
- El CLI de shadcn se ejecuta desde la aplicación. Su `components.json` apunta los alias de componentes, utilidades y
  estilos al paquete de interfaz, por lo que los archivos generados se instalan allí y no en la aplicación.
- El paquete de interfaz contiene únicamente los componentes base de shadcn/ui, sin conocimiento del dominio ni de la
  aplicación. Un componente propio no se añade a ese paquete.
- Los componentes propios se quedan en la aplicación, según su alcance:
  - los que pertenecen a una funcionalidad, en `features/<name>/components/`;
  - los reutilizables entre funcionalidades, en `components/common/`.
- Los contratos de la API (esquemas y tipos de petición y respuesta) se importan del paquete de contratos
  (`@autana/contracts/<name>`). El frontend no los redefine.
- El prefijo de la API y otras constantes que comparten backend y frontend también salen de paquetes del monorepo.
- La aplicación no importa código de otra aplicación del monorepo. Lo que dos aplicaciones necesitan se mueve a un
  paquete.
