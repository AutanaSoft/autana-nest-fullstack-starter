const reservedSuffixes = ["_test"]

// Las pruebas usan una base distinta de la de desarrollo, en el mismo servidor: `<base>_test`.
// Solo se llama desde el proceso principal de Vitest, donde DATABASE_URL todavía apunta a la base de desarrollo.
export function getTestDatabaseUrl(developmentUrl = process.env.DATABASE_URL!) {
  const url = new URL(developmentUrl)
  const name = url.pathname.slice(1)
  if (reservedSuffixes.some((suffix) => name.endsWith(suffix))) {
    throw new Error(`DATABASE_URL debe apuntar a la base de desarrollo, no a una de pruebas: ${name}`)
  }
  url.pathname = `/${name}_test`
  return url.toString()
}
