# Peticiones (`api/`)

Anterior: [Rutas](./rutas.md) · [Visión general](./README.md) · Siguiente: [Hooks](./hooks.md)

El cliente HTTP (`lib/api-client.ts`) es una instancia con el prefijo de la API como `baseURL`, tomado del paquete de
contratos. Las rutas se escriben sin el prefijo.

```ts
// features/products/api/fetch-products.ts
import { productListSchema } from "@<scope>/contracts/products"
import { apiClient } from "@/lib/api-client"

export async function fetchProducts(params: { status: string; page: number }, signal: AbortSignal) {
  const response = await apiClient.get("/products", { params, signal })
  return productListSchema.parse(response.data)
}
```

```ts
// features/products/api/create-product.ts
import { productSchema, type CreateProductInput } from "@<scope>/contracts/products"
import { apiClient } from "@/lib/api-client"

export async function createProduct(values: CreateProductInput) {
  const response = await apiClient.post("/products", values)
  return productSchema.parse(response.data)
}
```
