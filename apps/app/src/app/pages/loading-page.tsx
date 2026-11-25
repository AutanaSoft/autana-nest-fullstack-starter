import { Skeleton } from "@autana/ui/components/skeleton"

// Se muestra mientras se descarga el código de la primera ruta, que se carga de forma diferida.
export function LoadingPage() {
  return <Skeleton className="h-svh w-full rounded-none" />
}
