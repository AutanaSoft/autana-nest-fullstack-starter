# Rutas

[Visión general](./README.md) · Siguiente: [Peticiones](./peticiones.md)

Una pantalla privada no lleva layout propio: `features/panel` aplica la guarda de sesión, la barra lateral y la
cabecera. La ruta declara su título en `handle`, que la cabecera lee, y carga la página con `lazy`.

```tsx
// features/products/routes.tsx
import type { RouteObject } from "react-router"
import type { RouteHandle } from "@/lib/route-title"

export const productsRoutes: RouteObject = {
  path: "/products",
  handle: { title: "Productos" } satisfies RouteHandle,
  lazy: async () => ({ Component: (await import("./pages/products-page")).ProductsPage }),
}
```

```tsx
// app/router.tsx
import { createBrowserRouter } from "react-router"

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    children: [authRoutes, createPanelRoutes([productsRoutes]), { path: "*", Component: NotFoundPage }],
  },
])
```
