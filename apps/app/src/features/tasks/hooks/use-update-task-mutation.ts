import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateTask } from "../api/update-task"

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  })
}
