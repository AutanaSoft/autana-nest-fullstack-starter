import { useQuery } from "@tanstack/react-query"

import { fetchHealth } from "../api/fetch-health"

const refreshInterval = 30_000

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => fetchHealth(signal),
    refetchInterval: refreshInterval,
  })
}
