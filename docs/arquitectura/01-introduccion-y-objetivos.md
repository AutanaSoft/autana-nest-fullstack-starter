# Introducción y objetivos

## Backend

### Propósito y alcance

Este documento describe la arquitectura del backend: cómo se organiza el código, qué reglas rigen las dependencias y qué
convenciones siguen los módulos, las rutas, los errores y las pruebas. Es independiente del dominio de la aplicación.
Los ejemplos usan un recurso genérico (`<resource>`) y una operación genérica (`<action>`).

Está dirigido a quien añade o modifica módulos del backend. Las decisiones de diseño que no son evidentes se recogen en
la sección [Decisiones](./09-decisiones.md).

## Frontend

### Alcance

Este documento define cómo se organiza y cómo se relaciona el código de una aplicación web de React dentro de un
monorepo. Está dirigido a quienes escriben o revisan código del frontend.

Cubre la estructura de carpetas, las reglas de dependencia y las convenciones transversales (rutas, estado, datos,
errores, formularios, estilos, pruebas). No cubre las tecnologías elegidas ni sus versiones, que se listan en
[Stack tecnológico](./02-restricciones.md#stack-tecnológico), ni los procedimientos operativos, como instalar un
componente con el CLI.
