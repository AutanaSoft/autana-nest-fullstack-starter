# Estrategia de solución

## Backend

### Principios

- **Contrato único.** Los esquemas Zod de peticiones y respuestas se declaran una vez en un paquete compartido y los
  consumen el backend, el frontend y las pruebas. El documento OpenAPI se genera a partir de ellos, por lo que no hay
  contratos que mantener aparte.
- **Organización por funcionalidad.** El código se agrupa por módulo y no por tipo técnico.
- **Controladores finos.** El controlador solo traduce HTTP: valida los parámetros, fija el estado, llama a los
  servicios y declara el esquema de la respuesta. Las reglas y las consultas viven en los servicios, que no conocen
  HTTP.
- **Servicios con una sola responsabilidad.** Cada servicio se ocupa de un concepto de dominio. Si su nombre necesita
  una "y" o mezcla conceptos no relacionados, se divide. Los criterios están en
  [Responsabilidad de los servicios](./08-conceptos-transversales.md#responsabilidad-de-los-servicios).
- **Tipos inferidos.** Los tipos salen de los esquemas Zod (`z.infer`) y no se declaran clases DTO.
- **Respuestas filtradas.** Todo cuerpo correcto se valida y se filtra con el esquema del contrato antes de salir, de
  modo que ningún dato interno llega al cliente.
- **Errores públicos estables.** Cada error de las rutas de Nest expone un código propio y nunca el detalle interno. Las
  rutas de `/v1/auth/*` devuelven los errores nativos de Better Auth, con su propio `code`.

## Frontend

### Principios

- Agrupa el código por funcionalidad, no por tipo de archivo.
- Mantén juntas las rutas, layouts, páginas, componentes, hooks, peticiones y esquemas de una misma funcionalidad.
- Mueve a las carpetas comunes únicamente lo que usan varias funcionalidades.
- Antes de construir un componente de interfaz, comprueba si existe en el registro de shadcn/ui y úsalo. Las piezas
  propias se reservan para lo que el registro no cubre.
- Mantén una dirección única de dependencias: lo compartido no conoce a las funcionalidades y las funcionalidades no
  conocen a la aplicación.

### Visión general

El código se divide en tres capas. Cada capa solo puede importar de las que están a su derecha.

```text
app  ──►  features  ──►  compartido (components/, hooks/, lib/ y paquetes del monorepo)
```

- **`app/`** ensambla: router, proveedores globales y páginas globales.
- **`features/`** contiene cada funcionalidad aislada de las demás.
- **Compartido** reúne lo reutilizable: componentes comunes, hooks, utilidades y los paquetes del monorepo.
