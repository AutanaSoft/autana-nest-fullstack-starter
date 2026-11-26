import type { RouteObject } from "react-router"

import type { RouteHandle } from "@/lib/route-title"

// Página de inicio del panel. La monta `app/router.tsx` bajo el layout protegido del panel.
export const statusRoutes: RouteObject = {
  index: true,
  handle: { title: "Estado" } satisfies RouteHandle,
  lazy: async () => ({ Component: (await import("./pages/status-page")).StatusPage }),
}
