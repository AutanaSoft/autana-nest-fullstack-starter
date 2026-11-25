import { QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@autana/ui/components/tooltip"

import { ThemeProvider } from "@/components/theme-provider"
import { createQueryClient } from "@/lib/query-client"

const queryClient = createQueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
