import { taskSchema, type UpdateTaskValues } from "@autana/contracts/tasks"

import { apiClient } from "@/lib/api-client"

export async function updateTask({ taskId, ...values }: UpdateTaskValues & { taskId: string }) {
  const response = await apiClient.patch(`/tasks/${taskId}`, values)
  return taskSchema.parse(response.data)
}
