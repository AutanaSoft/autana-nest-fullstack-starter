import type { RouteObject } from "react-router"

import type { RouteHandle } from "@/lib/route-title"

// La monta `app/router.tsx` bajo el layout protegido del panel.
export const profileRoutes: RouteObject = {
  path: "/profile",
  handle: { title: "Perfil" } satisfies RouteHandle,
  lazy: async () => ({ Component: (await import("./pages/profile-page")).ProfilePage }),
}
