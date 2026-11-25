import { vi } from "vitest"

// jsdom no implementa `window.matchMedia`. Sustituye la función por una consulta que coincide según `matches` y que
// permite simular un cambio de preferencia con `setMatches`. Se deshace con `vi.unstubAllGlobals()`.
export function stubMatchMedia(matches = false) {
  const listeners = new Set<() => void>()
  const query = {
    matches,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query)
  )

  return {
    setMatches(next: boolean) {
      query.matches = next
      listeners.forEach((listener) => listener())
    },
  }
}
