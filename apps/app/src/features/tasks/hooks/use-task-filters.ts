import { useSearchParams } from "react-router"
import { taskStatuses, type TaskStatus } from "@autana/contracts/tasks"

export type TaskStatusFilter = TaskStatus | "all"

// El filtro y la página viven en la URL, para que se puedan compartir y sobrevivan a una recarga.
export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status: TaskStatusFilter = taskStatuses.find((candidate) => candidate === searchParams.get("status")) ?? "all"
  const pageParam = Number(searchParams.get("page"))
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1

  // Cambiar el filtro vuelve a la primera página.
  function setStatus(nextStatus: TaskStatusFilter) {
    const params = new URLSearchParams()
    if (nextStatus !== "all") params.set("status", nextStatus)
    setSearchParams(params)
  }

  // Parámetros de búsqueda de una página, conservando el filtro. Sirve para el `href` de los enlaces de paginación.
  function getPageSearch(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    if (nextPage > 1) params.set("page", String(nextPage))
    else params.delete("page")
    return params.toString()
  }

  function setPage(nextPage: number) {
    setSearchParams(new URLSearchParams(getPageSearch(nextPage)))
  }

  return { status, page, setStatus, setPage, getPageSearch }
}
