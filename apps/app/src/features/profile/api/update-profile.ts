import { profileSchema, type UpdateProfileValues } from "@autana/contracts/profile"

import { apiClient } from "@/lib/api-client"

export async function updateProfile(values: UpdateProfileValues) {
  const response = await apiClient.put("/profile", values)
  return profileSchema.parse(response.data)
}
