import { useQuery } from "@tanstack/react-query"

import { fetchProfile } from "../api/fetch-profile"

export function useProfileQuery() {
  return useQuery({ queryKey: ["profile"], queryFn: ({ signal }) => fetchProfile(signal) })
}
