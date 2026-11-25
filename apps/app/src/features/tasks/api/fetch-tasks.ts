import { listTasksResponseSchema, type ListTasksQuery } from "@autana/contracts/tasks"

import { apiClient } from "@/lib/api-client"

export async function fetchTasks(params: Partial<ListTasksQuery>, signal: AbortSignal) {
  const response = await apiClient.get("/tasks", { params, signal })
  return listTasksResponseSchema.parse(response.data)
}
