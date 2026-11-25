# Arquitectura

La documentación de arquitectura sigue la plantilla [arc42](https://docs.arc42.org/home/). Cada sección de arc42 se crea
solo cuando hay contenido que documentar, por lo que la numeración tiene huecos a propósito.

## Secciones

| Sección                                                          | Contenido                                      |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| [01. Introducción y objetivos](./01-introduccion-y-objetivos.md) | Propósito y alcance de cada parte.             |
| [02. Restricciones](./02-restricciones.md)                       | Stack tecnológico y versiones.                 |
| [03. Contexto y alcance](./03-contexto-y-alcance.md)             | Monorepo, aplicaciones y contrato HTTP.        |
| [04. Estrategia de solución](./04-estrategia-de-solucion.md)     | Principios y visión general.                   |
| [05. Vista de bloques](./05-vista-de-bloques.md)                 | Carpetas y reglas de dependencia.              |
| [06. Vista de ejecución](./06-vista-de-ejecucion.md)             | Ciclo de una petición, flujo de datos y rutas. |
| [08. Conceptos transversales](./08-conceptos-transversales.md)   | Errores, autenticación, estado y pruebas.      |
| [09. Decisiones](./09-decisiones.md)                             | Decisiones y alternativas descartadas.         |
| [11. Riesgos y deuda técnica](./11-riesgos-y-deuda-tecnica.md)   | Pendientes y riesgos, con su condición.        |
| [12. Glosario](./12-glosario.md)                                 | Términos del proyecto.                         |

Aún no existen las secciones 07 (despliegue) y 10 (requisitos de calidad).

## Guías

Los ejemplos de código viven en [`docs/guias/`](../guias/), para no sobrecargar las secciones de arquitectura.
