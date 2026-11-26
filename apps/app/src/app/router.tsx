import { createBrowserRouter } from "react-router"

import { accountRoutes } from "@/features/account/routes"
import { authRoutes } from "@/features/auth/routes"
import { createPanelRoutes } from "@/features/panel/routes"
import { statusRoutes } from "@/features/status/routes"
import { RootLayout } from "./layouts/root-layout"
import { ErrorPage } from "./pages/error-page"
import { LoadingPage } from "./pages/loading-page"
import { NotFoundPage } from "./pages/not-found-page"

// Las funcionalidades protegidas se montan bajo el layout del panel, que aplica la guarda de sesión. La página de
// estado es su ruta índice: la raíz `/` es la página de inicio del panel.
const panelRoutes = createPanelRoutes([statusRoutes, accountRoutes])

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    HydrateFallback: LoadingPage,
    children: [authRoutes, panelRoutes, { path: "*", Component: NotFoundPage }],
  },
])
