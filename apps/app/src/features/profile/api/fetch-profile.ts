import { profileSchema } from "@autana/contracts/profile"

import { apiClient } from "@/lib/api-client"

export async function fetchProfile(signal: AbortSignal) {
  const response = await apiClient.get("/profile", { signal })
  return profileSchema.parse(response.data)
}
