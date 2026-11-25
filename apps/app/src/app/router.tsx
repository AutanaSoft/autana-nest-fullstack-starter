import { createBrowserRouter, Navigate } from "react-router"

import { authRoutes } from "@/features/auth/routes"
import { createPanelRoutes } from "@/features/panel/routes"
import { profileRoutes } from "@/features/profile/routes"
import { tasksRoutes } from "@/features/tasks/routes"
import { RootLayout } from "./layouts/root-layout"
import { ErrorPage } from "./pages/error-page"
import { LoadingPage } from "./pages/loading-page"
import { NotFoundPage } from "./pages/not-found-page"

// Las funcionalidades protegidas se montan bajo el layout del panel, que aplica la guarda de sesión.
const panelRoutes = createPanelRoutes([tasksRoutes, profileRoutes])

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    HydrateFallback: LoadingPage,
    children: [
      // La raíz no tiene pantalla propia: lleva a la primera del panel, que pide iniciar sesión si hace falta.
      { index: true, element: <Navigate to="/tasks" replace /> },
      authRoutes,
      panelRoutes,
      { path: "*", Component: NotFoundPage },
    ],
  },
])
