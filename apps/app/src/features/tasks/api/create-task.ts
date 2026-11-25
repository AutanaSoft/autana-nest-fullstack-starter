import { taskSchema, type CreateTaskValues } from "@autana/contracts/tasks"

import { apiClient } from "@/lib/api-client"

export async function createTask(values: CreateTaskValues) {
  const response = await apiClient.post("/tasks", values)
  return taskSchema.parse(response.data)
}
