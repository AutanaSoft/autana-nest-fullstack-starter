import type { RouteObject } from "react-router"

import type { RouteHandle } from "@/lib/route-title"

// La monta `app/router.tsx` bajo el layout protegido del panel.
export const accountRoutes: RouteObject = {
  path: "/account",
  handle: { title: "Cuenta" } satisfies RouteHandle,
  lazy: async () => ({ Component: (await import("./pages/account-page")).AccountPage }),
}
