import { Navigate, Outlet } from "react-router"
import { Alert, AlertDescription } from "@autana/ui/components/alert"
import { Skeleton } from "@autana/ui/components/skeleton"
import { SidebarInset, SidebarProvider } from "@autana/ui/components/sidebar"

import { authClient } from "@/lib/auth-client"

import { AppSidebar } from "../components/app-sidebar"
import { SiteHeader } from "../components/site-header"

export function PanelLayout() {
  const session = authClient.useSession()

  if (session.isPending) return <Skeleton className="h-40 w-full" />
  // Un fallo de red no expulsa al usuario: solo se redirige cuando no hay sesión.
  if (session.error) {
    return (
      <Alert variant="destructive" className="m-6 w-auto">
        <AlertDescription>No pudimos comprobar tu sesión. Recarga la página.</AlertDescription>
      </Alert>
    )
  }
  if (!session.data) return <Navigate to="/auth/sign-in" replace />

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={session.data.user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
