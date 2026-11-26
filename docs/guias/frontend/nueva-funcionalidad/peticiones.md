# Peticiones (`api/`)

Anterior: [Rutas](./rutas.md) · [Visión general](./README.md) · Siguiente: [Hooks](./hooks.md)

Cada archivo hace una petición con `apiClient` y valida la respuesta con el esquema del contrato.

```ts
// features/products/api/fetch-products.ts
import { productListSchema } from "@autana/contracts/products"
import { apiClient } from "@/lib/api-client"

export async function fetchProducts(params: { status: string; page: number }, signal: AbortSignal) {
  const response = await apiClient.get("/products", { params, signal })
  return productListSchema.parse(response.data)
}
```

```ts
// features/products/api/create-product.ts
import { productSchema, type CreateProductInput } from "@autana/contracts/products"
import { apiClient } from "@/lib/api-client"

export async function createProduct(values: CreateProductInput) {
  const response = await apiClient.post("/products", values)
  return productSchema.parse(response.data)
}
```
