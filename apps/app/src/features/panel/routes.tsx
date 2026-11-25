import type { RouteObject } from "react-router"

// Ruta sin ruta propia: aplica el layout protegido (guarda de sesión, barra lateral y cabecera) a las funcionalidades
// que recibe como `children`. El layout se descarga al entrar en cualquiera de ellas.
export function createPanelRoutes(children: RouteObject[]): RouteObject {
  return {
    lazy: async () => ({ Component: (await import("./layouts/panel-layout")).PanelLayout }),
    children,
  }
}
