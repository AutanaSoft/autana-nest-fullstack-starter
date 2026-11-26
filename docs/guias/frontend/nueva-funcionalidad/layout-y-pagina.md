# Layout y página

Anterior: [Hooks](./hooks.md) · [Visión general](./README.md) · Siguiente:
[Esquema y formulario](./esquema-y-formulario.md)

Una pantalla privada no lleva layout propio: la envuelve el del panel. La página llama a los hooks, define la acción de
crear y compone los componentes.

```tsx
// features/products/pages/products-page.tsx
import type { CreateProductInput } from "@autana/contracts/products"
import { Alert, AlertDescription } from "@autana/ui/components/alert"
import { Skeleton } from "@autana/ui/components/skeleton"
import { CreateProductDialog } from "../components/dialogs/create-product-dialog"
import { ProductStatusTabs } from "../components/filters/product-status-tabs"
import { ProductList } from "../components/lists/product-list"
import { ProductPagination } from "../components/lists/product-pagination"
import { useCreateProductMutation } from "../hooks/use-create-product-mutation"
import { useProductFilters } from "../hooks/use-product-filters"
import { useProductsQuery } from "../hooks/use-products-query"

export function ProductsPage() {
  const { status, page, setStatus, setPage } = useProductFilters()
  const productList = useProductsQuery({ status, page })
  const createProduct = useCreateProductMutation()

  async function handleSubmit(values: CreateProductInput) {
    await createProduct.mutateAsync(values)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProductStatusTabs value={status} onChange={setStatus} />
        <CreateProductDialog onSubmit={handleSubmit} />
      </div>
      {productList.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : productList.isError ? (
        <Alert variant="destructive">
          <AlertDescription>No pudimos cargar los productos. Inténtalo de nuevo.</AlertDescription>
        </Alert>
      ) : (
        <ProductList products={productList.data.items} />
      )}
      <ProductPagination page={page} onPageChange={setPage} />
    </>
  )
}
```
