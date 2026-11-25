import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateProfile } from "../api/update-profile"

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    // La respuesta ya es el perfil guardado: se usa como caché en lugar de volver a pedirlo.
    onSuccess: (profile) => queryClient.setQueryData(["profile"], profile),
  })
}
