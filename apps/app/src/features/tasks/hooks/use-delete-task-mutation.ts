import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTask } from "../api/delete-task"

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })
}
