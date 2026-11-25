# AGENTS

Reglas obligatorias para toda persona o agente de IA que trabaje en este repositorio, respetando sus convenciones.

Si una regla de este archivo entra en conflicto con una habilidad instalada, prevalece este archivo.

## Idioma y comunicación

- Responde en el idioma que use el desarrollador y mantén un tono neutral, profesional y técnico.
- Usa el inglés para los identificadores nuevos del código, incluidos los nombres de variables, funciones y clases.

## Documentación del proyecto

- Comienza por `README.md` para consultar la descripción general del proyecto. Los comandos de instalación,
  configuración, ejecución y pruebas están en `docs/guias/general/`, a donde enlaza el README. Si falta información o
  contradice la configuración actual, consulta los archivos pertinentes del proyecto e informa de la discrepancia.
- Lee únicamente la documentación pertinente para la tarea actual; no leas todo el contenido de `docs/` de forma
  predeterminada.
- Guarda los documentos de arquitectura en `docs/arquitectura/`, los de requisitos del producto (PRD) en `docs/prd/`,
  los planes de implementación en `docs/plans/` y las guías prácticas con ejemplos de código en `docs/guias/`.

### Arquitectura (arc42)

- La documentación de arquitectura sigue la plantilla [arc42](https://docs.arc42.org/home/), con una sección por archivo
  numerada como en arc42 (por ejemplo, `08-conceptos-transversales.md`). Empieza por `docs/arquitectura/README.md`, que
  indica qué secciones existen.
- Actualiza la sección existente que corresponda al contenido. No dupliques información entre secciones: enlaza a ella.
- Crea una sección nueva solo cuando haya contenido real que documentar. No crees secciones vacías ni con texto de
  relleno; los huecos en la numeración son intencionados. Al crearla, añádela al índice.
- Mantén el contenido de arquitectura (qué es y por qué) separado de las guías prácticas (cómo se hace). Los ejemplos de
  código van en `docs/guias/`, dentro de `backend/` o `frontend/`, y las secciones de arquitectura los enlazan. Las
  guías que no pertenecen a una sola parte, como los comandos y la configuración, van en `docs/guias/general/`.

## Formato y calidad del código

- Utiliza los formateadores configurados en el proyecto para los archivos que generes o edites. No reproduzcas
  manualmente el formato que las herramientas pueden aplicar.
- Utiliza la configuración existente. Consulta los archivos de configuración de formato, linting y análisis estático
  únicamente cuando sea necesario para resolver errores, conflictos o resultados inesperados.
- Para archivos Markdown y MDX, ejecuta Prettier antes de `markdownlint-cli2`.
- Mantén los cambios de formato dentro del alcance acordado. Si una herramienta también modifica contenido ajeno a ese
  alcance, informa de ello y solicita autorización antes de conservar esos cambios.
- Respeta las exclusiones configuradas en cada herramienta. No apliques formato manualmente a archivos generados que
  estén excluidos del flujo de formato del proyecto.
- Ejecuta las comprobaciones de linting y análisis estático que correspondan. Limita las correcciones automáticas al
  formato; informa de los demás hallazgos que queden fuera del alcance acordado, en lugar de cambiar el comportamiento
  para resolverlos.
- No desactives ni flexibilices reglas, añadas directivas de supresión ni modifiques la configuración de las
  herramientas para superar las comprobaciones sin la autorización explícita del usuario.
- Si una herramienta necesaria no está disponible, informa de la limitación. No instales herramientas ni las sustituyas
  por otras sin la autorización explícita del usuario.

## Simplicidad y mantenibilidad del código

- Escribe código limpio, sencillo y mantenible. Prefiere nombres claros y un flujo de control fácil de seguir frente a
  implementaciones ingeniosas o innecesariamente compactas.
- Implementa la solución más sencilla que satisfaga los requisitos actuales. No añadas abstracciones, capas, opciones de
  configuración ni puntos de extensión para necesidades futuras hipotéticas.
- Aplica el principio de responsabilidad única: mantén cada función, clase o módulo enfocado en una responsabilidad
  coherente. Separa las responsabilidades no relacionadas sin fragmentar lógica sencilla en funciones auxiliares
  innecesarias.
- Aprovecha las capacidades existentes del proyecto y el comportamiento configurado de sus herramientas antes de
  introducir implementaciones propias que los dupliquen.
- Introduce complejidad únicamente cuando un requisito concreto o una restricción demostrada la justifique. Explica la
  decisión y sus implicaciones cuando el motivo no resulte evidente en el código.

## Backend (NestJS)

- La versión de NestJS del proyecto es más reciente que el conocimiento de un modelo. Antes de suponer una API, consulta
  la documentación oficial: <https://docs.nestjs.com/llms.txt> indexa una página en markdown por capítulo.
- Las habilidades oficiales de Nest (`nestjs`, `nestjs-feature`, `nestjs-auth`, `nestjs-data`, `nestjs-production` y
  `nestjs-testing`) están en `.agents/skills/`. Se actualizan con `npx @nestjs/skills add --agent all`, ejecutado desde
  la raíz del repositorio.
- Antes de añadir una librería o escribir una implementación propia, comprueba si Nest tiene un paquete oficial:
  `@nestjs/drizzle`, `@nestjs/swagger`, `@nestjs/config`, `@nestjs/throttler`, `@nestjs/authentication`,
  `@nestjs/authorization`, `@nestjs/schedule`, `@nestjs/bullmq` y otros. El índice de la documentación los lista todos.
- La validación y la serialización usan Standard Schema con Zod: `StandardSchemaValidationPipe` con `@Body({ schema })`,
  `@Param` y `@Query`, y `StandardSchemaSerializerInterceptor` con `@SerializeOptions({ schema })`. No uses
  `class-validator` ni clases DTO.
- Los paquetes de Nest son solo ESM y el proyecto también: los imports relativos terminan en `.js`, `__dirname` no
  existe (usa `import.meta.dirname`) y las pruebas usan Vitest, por lo que los dobles se crean con `vi.fn()` y no con
  `jest.fn()`.
- Cubre el comportamiento que cambias con pruebas enfocadas, salvo que se indique otra forma de probar, en lugar de
  añadir suites e2e amplias.
- NestJS Observe recibe la telemetría de producción solo si se registra `ObserveModule` (`npx @nestjs/observe link`). Si
  está activo, usa sus datos de errores, trazas y regresiones cuando la tarea dependa del comportamiento en producción.

## Commits y publicación de cambios

- No crees ni enmiendes commits sin una solicitud explícita del usuario.
- No ejecutes un push sin una solicitud explícita del usuario. La autorización para crear un commit no implica
  autorización para hacer push.
- Al preparar un commit, utiliza la habilidad `commit-message` si está disponible.

## Comentarios y documentación

- Documenta las interfaces y los comportamientos cuando su propósito, contrato o limitaciones no sean evidentes. Evita
  la documentación que se limite a repetir nombres, tipos o detalles de implementación.
- Utiliza los comentarios para explicar decisiones, intenciones o limitaciones que no sean evidentes. No repitas lo que
  el código ya expresa.
- Sigue las herramientas y convenciones de documentación existentes en el proyecto. Mantén la documentación coherente
  con los cambios que realices.
- Coloca la información donde sus destinatarios puedan encontrarla. Los comentarios internos del código no sustituyen la
  documentación dirigida a los usuarios.

## Evidencia y verificación

- Fundamenta las afirmaciones técnicas y las decisiones de implementación en la documentación pertinente del proyecto,
  su configuración y el código existente. Verifica las suposiciones inciertas antes de basarte en ellas.
- Cuando existan dudas sobre la API, la compatibilidad o el comportamiento de una dependencia, consulta la documentación
  oficial aplicable a la versión utilizada por el proyecto. Revisa los tipos o el código fuente instalados cuando sea
  necesario.
- Respalda las afirmaciones y decisiones técnicas que no sean evidentes con referencias verificables, como rutas del
  proyecto o direcciones URL y versiones de la documentación.
- Investiga las cuestiones pendientes utilizando la evidencia disponible. Si persiste una incertidumbre que afecte a la
  solución, explícala y consulta al usuario antes de continuar.
- No modifiques archivos fuera del alcance acordado sin la autorización explícita del usuario.
- Si el usuario cuestiona una afirmación técnica, verifícala antes de aceptarla o rechazarla.

## Cambios existentes

- Conserva los cambios existentes, incluidas las modificaciones al contenido generado previamente por el agente. No
  asumas que la versión anterior del agente es la referencia correcta.
- No reviertas, sobrescribas ni modifiques cambios existentes, salvo que la solicitud del usuario lo autorice dentro del
  alcance acordado.
- Si identificas un posible problema fuera de ese alcance, aporta evidencia verificable, como una ruta de archivo y un
  número de línea o un diff, y solicita autorización antes de modificarlo.
- Cuando el usuario solicite un ajuste o una reversión, modifica únicamente lo necesario y conserva el trabajo no
  relacionado.
