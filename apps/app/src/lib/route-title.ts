import { useMatches } from "react-router"

// Las rutas declaran su título en `handle`: el encabezado del panel lo lee sin importar la funcionalidad.
export type RouteHandle = { title: string }

export function useRouteTitle() {
  const handles = useMatches().map((match) => match.handle)
  return handles.findLast(
    (handle): handle is RouteHandle => typeof (handle as RouteHandle | undefined)?.title === "string"
  )?.title
}
