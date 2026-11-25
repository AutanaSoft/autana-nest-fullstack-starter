import type { createDatabase } from "@autana/database/client"

// Tipo del cliente que se inyecta con `@InjectDrizzle()`.
export type Database = ReturnType<typeof createDatabase>["db"]
