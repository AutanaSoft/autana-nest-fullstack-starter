# Riesgos y deuda técnica

Esta sección lista únicamente lo que está pendiente. Al resolver una entrada, se elimina de aquí: la historia queda en
`git`.

## Deuda técnica

Cada entrada indica por qué se difiere y la condición que obliga a resolverla.

- **Las rutas `/v1/auth/*` no cumplen el contrato de error de la API** (`errorResponseSchema`) ni las cuenta
  `ThrottlerGuard`.
  - Por qué se difiere: Better Auth las atiende como middleware, fuera de los filtros y guards de Nest, y ninguno de sus
    puntos de extensión alcanza todas las respuestas (ver [decisiones](./09-decisiones.md)).
  - Condición: si un consumidor necesita el contrato en esas rutas, hay que reescribir la respuesta de Node en la opción
    `middleware` de `AuthModule`.
- **El límite de peticiones guarda los contadores en la memoria del proceso.**
  - Por qué se difiere: con una sola instancia basta y no añade infraestructura.
  - Condición: si la API se despliega con varias instancias, hay que usar un almacén compartido.
- **La protección CSRF deja pasar las peticiones sin `Origin` ni `Sec-Fetch-Site`.** Los navegadores actuales envían al
  menos una de las dos; las deja pasar porque asume un cliente que no es un navegador.
  - Por qué se difiere: esos clientes no llevan la cookie de sesión de otro sitio, y CORS y `SameSite=Lax` cubren el
    resto.
  - Condición: si hay que rechazarlas, se añade un guard que exija `Origin` en las peticiones que cambian estado.
- **Las rutas desconocidas fuera de `/v1` responden la página HTML por defecto de Express,** no el contrato de error.
  - Por qué se difiere: la API solo sirve rutas bajo el prefijo `/v1`.
  - Condición: si la API sirve algo fuera del prefijo.
- **Hay una sola migración (`0000_db_init`),** que se regenera al cambiar el esquema.
  - Por qué se difiere: la plantilla no tiene datos que preservar.
  - Condición: antes del primer despliegue con datos reales, hay que pasar a migraciones incrementales.

## Riesgos

- **El despliegue no está definido.** Se soportan el frontend y la API bajo el mismo origen (proxy inverso) o en
  dominios distintos del mismo sitio con `VITE_API_URL`, como describe
  [Autenticación en el frontend](./08-conceptos-transversales.md#autenticación-en-el-frontend). Los dominios distintos
  no tienen prueba de extremo a extremo.
  - Mitigación: la prueba del cliente cubre el `baseURL`. Al elegir el despliegue debe crearse la sección 07 y
    comprobarse el inicio de sesión contra los dominios reales.
- **No hay verificación de correo ni recuperación de contraseña.** Una cuenta se crea con cualquier correo bien formado,
  sin comprobar que sea del usuario.
  - Mitigación: ninguna. No se han pedido.
- **Se permiten contraseñas formadas solo por espacios,** porque la contraseña no se recorta ni se normaliza.
  - Mitigación: es una decisión consciente, porque recortarla la modificaría sin avisar al usuario.
- **Las reglas de dependencia del frontend** se comprueban solo en revisión, sin una regla de lint, como indica la nota
  de [Reglas de dependencia](./05-vista-de-bloques.md#reglas-de-dependencia-1).
- **No hay [pruebas de extremo a extremo](./08-conceptos-transversales.md#pruebas-de-extremo-a-extremo).** Ninguna
  prueba recorre el frontend y la API juntas en un navegador real, así que no se comprueban la cookie de sesión entre
  recargas, las guardas de ruta ni el proxy de Vite.
  - Mitigación: las pruebas de componentes (MSW) y las de la API cubren cada lado por separado. Podrían añadirse a la
    integración continua al definir el despliegue.
- **Bajo Vitest, Better Auth desactiva la comprobación de origen,** por lo que `403 INVALID_ORIGIN` no tiene prueba
  automática.
  - Mitigación: se comprueba a mano contra la API en ejecución.
