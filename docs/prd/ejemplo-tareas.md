# PRD de ejemplo: tareas

> Documento de ejemplo que describe la funcionalidad `tasks` incluida en la plantilla. Úsalo como modelo de formato y
> elimínalo junto con la funcionalidad.

## Problema

Una persona autenticada necesita llevar un registro personal de lo que debe hacer y ver en qué estado está cada cosa.

## Alcance

- Incluye: crear, listar, consultar, modificar y eliminar tareas propias.
- No incluye: tareas compartidas entre usuarios, fechas de vencimiento, etiquetas ni adjuntos.

## Reglas

1. Cada tarea pertenece a un usuario. Nadie puede ver ni modificar las de otra persona.
2. Una tarea tiene un título obligatorio de hasta 120 caracteres y una descripción opcional de hasta 500.
3. Una tarea siempre se crea en estado `todo`. Los estados posibles son `todo`, `in_progress` y `done`, y solo cambian
   al modificar la tarea.
4. Una modificación debe indicar al menos un campo.
5. La lista se pagina (20 tareas por página, 100 como máximo) y se puede filtrar por estado.

## Criterios de aceptación

- Sin sesión, ninguna operación está disponible.
- Una tarea ajena se comporta como si no existiera.
- Al crear una tarea con título vacío o demasiado largo, se muestra el error en el formulario sin cerrarlo.
- El filtro por estado y la página actual se conservan al recargar la pantalla.
- Eliminar una tarea pide confirmación.

## Fuera de este documento

El diseño técnico se describe en la [arquitectura](../arquitectura/README.md).
