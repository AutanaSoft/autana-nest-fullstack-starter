import type { RouteObject } from "react-router"

import type { RouteHandle } from "@/lib/route-title"

// La monta `app/router.tsx` bajo el layout protegido del panel.
export const tasksRoutes: RouteObject = {
  path: "/tasks",
  handle: { title: "Tareas" } satisfies RouteHandle,
  lazy: async () => ({ Component: (await import("./pages/tasks-page")).TasksPage }),
}
