# Glosario

## General

- **Variable de entorno:** valor que se lee del entorno o del `.env` y se valida con el esquema de su configuración. Se
  nombra en `UPPER_SNAKE_CASE`.
- **Variable propia:** valor de una configuración que no se lee del entorno, sino que se deriva de él o es una constante
  de la aplicación. Se nombra en `camelCase`.
- **Prueba unitaria:** prueba de una función, un esquema, un hook o un middleware que no necesita la aplicación completa
  ni una base de datos. Puede usar el framework real (unitaria _sociable_).
- **Prueba de componente:** prueba de un componente o una página de React, tal como los usa una persona. No es el
  _component test_ de Fowler.
- **Prueba de integración:** prueba que comprueba que varias piezas funcionan conectadas, como la aplicación completa
  con su base de datos.
- **Prueba de extremo a extremo (E2E):** prueba que recorre el frontend y la API juntas en un navegador real.

## Frontend

- **Funcionalidad (_feature_):** conjunto de código que implementa una capacidad del producto y que solo ella utiliza.
- **Layout:** componente de ruta que aporta estructura común a sus páginas hijas y renderiza `<Outlet />`.
- **Página:** componente de ruta que conecta la URL con los datos y compone la interfaz.
