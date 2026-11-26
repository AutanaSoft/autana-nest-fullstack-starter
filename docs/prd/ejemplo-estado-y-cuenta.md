# PRD de ejemplo: estado y cuenta

> Documento de ejemplo que describe las páginas de estado y de cuenta incluidas en la plantilla. Úsalo como modelo de
> formato y elimínalo junto con ellas.

## Problema

Quien parte de la plantilla necesita comprobar, al levantar un proyecto nuevo, que la autenticación, la API, la base de
datos y el frontend funcionan juntos, sin cargar con funcionalidades de negocio que luego tenga que retirar.

## Alcance

- Incluye: una página de estado con la salud de la API y una página de cuenta con los datos del usuario y el cambio de
  nombre.
- No incluye: cambio de correo o de contraseña, foto de perfil, historial de la salud ni alertas.

## Reglas

1. La API expone dos comprobaciones públicas para el orquestador: si el proceso responde y si puede atender peticiones
   (depende de la base de datos).
2. El detalle de la salud (base de datos, memoria y disco) solo está disponible con sesión.
3. Cuando una dependencia falla, la API responde `503` con el detalle de qué indicador ha fallado.
4. La página de estado es la página de inicio del panel y se actualiza sola cada 30 segundos.
5. La página de cuenta muestra el nombre, el correo, si el correo está verificado y la fecha de alta. Solo el nombre se
   puede cambiar, con las mismas reglas que en el registro.

## Criterios de aceptación

- Sin sesión, el detalle de la salud responde `401` y el panel lleva al inicio de sesión.
- Con la base de datos caída, la página de estado muestra qué indicador falla y su mensaje.
- Tras iniciar sesión o registrarse, la aplicación muestra la página de estado.
- Un nombre que no cumple las reglas muestra el error en el formulario sin enviarse.
- Un nombre válido se guarda y se confirma en la página.

## Fuera de este documento

El diseño técnico se describe en la [arquitectura](../arquitectura/README.md) y los pasos, en el
[plan de ejemplo](../plans/ejemplo-estado-y-cuenta.md).
