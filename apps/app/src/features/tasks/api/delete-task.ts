import { apiClient } from "@/lib/api-client"

export async function deleteTask(taskId: string) {
  await apiClient.delete(`/tasks/${taskId}`)
}
