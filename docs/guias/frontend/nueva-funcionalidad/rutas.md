# Rutas

[Visión general](./README.md) · Siguiente: [Peticiones](./peticiones.md)

La ruta de una pantalla privada declara su título y carga la página de forma diferida. `app/router.tsx` la monta bajo el
panel.

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
