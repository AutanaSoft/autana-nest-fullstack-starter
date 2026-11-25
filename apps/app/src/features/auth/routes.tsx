import { Navigate, type RouteObject } from "react-router"

import { AuthLayout } from "./layouts/auth-layout"
import { SignInPage } from "./pages/sign-in-page"
import { SignUpPage } from "./pages/sign-up-page"

export const authRoutes: RouteObject = {
  path: "/auth",
  Component: AuthLayout,
  children: [
    { index: true, element: <Navigate to="sign-in" replace /> },
    { path: "sign-in", Component: SignInPage },
    { path: "sign-up", Component: SignUpPage },
  ],
}
