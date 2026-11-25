import { Separator } from "@autana/ui/components/separator"
import { SidebarTrigger } from "@autana/ui/components/sidebar"

import { useRouteTitle } from "@/lib/route-title"

export function SiteHeader() {
  const title = useRouteTitle()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
