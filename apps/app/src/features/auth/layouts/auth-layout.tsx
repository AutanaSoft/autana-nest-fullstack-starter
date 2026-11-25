import { Navigate, Outlet } from "react-router"

import { authClient } from "@/lib/auth-client"

export function AuthLayout() {
  const session = authClient.useSession()

  if (session.data) return <Navigate to="/tasks" replace />

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
