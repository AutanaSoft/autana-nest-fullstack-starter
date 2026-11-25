import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ListTasksQuery } from "@autana/contracts/tasks"

import { fetchTasks } from "../api/fetch-tasks"

export function useTasksQuery(params: Partial<ListTasksQuery>) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: ({ signal }) => fetchTasks(params, signal),
    // Al cambiar de página o de filtro se muestra la lista anterior hasta que llega la nueva.
    placeholderData: keepPreviousData,
  })
}
