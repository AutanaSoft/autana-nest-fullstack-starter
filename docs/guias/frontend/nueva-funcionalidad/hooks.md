# Hooks (`hooks/`)

Anterior: [Peticiones](./peticiones.md) · [Visión general](./README.md) · Siguiente:
[Layout y página](./layout-y-pagina.md)

```ts
// features/products/hooks/use-products-query.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchProducts } from "../api/fetch-products"

export function useProductsQuery(params: { status: string; page: number }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: ({ signal }) => fetchProducts(params, signal),
    placeholderData: keepPreviousData,
  })
}
```

```ts
// features/products/hooks/use-create-product-mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProduct } from "../api/create-product"

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  })
}
```

```ts
// features/products/hooks/use-product-filters.ts
import { useSearchParams } from "react-router"

export type ProductStatus = "active" | "archived" | "all"

const statuses: ProductStatus[] = ["active", "archived", "all"]

export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = statuses.find((candidate) => candidate === searchParams.get("status")) ?? "active"
  const pageParam = Number(searchParams.get("page"))
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1

  // Cambiar un filtro vuelve a la primera página.
  function setStatus(nextStatus: ProductStatus) {
    const params = new URLSearchParams()
    if (nextStatus !== "active") params.set("status", nextStatus)
    setSearchParams(params)
  }

  function setPage(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    if (nextPage > 1) params.set("page", String(nextPage))
    else params.delete("page")
    setSearchParams(params)
  }

  return { status, page, setStatus, setPage }
}
```
