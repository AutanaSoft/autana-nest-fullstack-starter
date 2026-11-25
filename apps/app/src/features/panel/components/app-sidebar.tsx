import * as React from "react"
import { Link } from "react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@autana/ui/components/sidebar"
import { ListIcon, UserIcon, CommandIcon } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

// Las entradas del menú: al añadir una funcionalidad protegida se añade su enlace aquí.
const navMain = [
  { title: "Tareas", url: "/tasks", icon: <ListIcon /> },
  { title: "Perfil", url: "/profile", icon: <UserIcon /> },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: React.ComponentProps<typeof NavUser>["user"] }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<Link to="/tasks" />}>
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">Autana</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
