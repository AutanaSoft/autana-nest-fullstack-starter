import { Button } from "@autana/ui/components/button"

// Se muestra cuando una ruta lanza un error inesperado. No expone el detalle: React Router ya lo registra en consola.
export function ErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Algo salió mal</h1>
        <p className="text-muted-foreground">
          Ocurrió un error inesperado. Recarga la página para intentarlo de nuevo.
        </p>
      </div>
      <Button onClick={() => window.location.reload()}>Recargar la página</Button>
    </div>
  )
}
