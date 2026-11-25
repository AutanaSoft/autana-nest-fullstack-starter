# Layout y página

Anterior: [Hooks](./hooks.md) · [Visión general](./README.md) · Siguiente:
[Esquema y formulario](./esquema-y-formulario.md)

Las pantallas privadas no tienen layout propio. El layout de `features/panel` (`PanelLayout`) las envuelve: comprueba la
sesión y redirige a `/auth/sign-in` cuando no existe, y muestra la barra lateral y la cabecera con el título de la ruta.
Si la comprobación falla por un error, no redirige, para no expulsar al usuario por un fallo de red. Crea un layout en
la funcionalidad solo si añade estructura propia a sus páginas.

La página conecta la ruta con los datos: llama a los hooks, define las acciones y compone los componentes.

```tsx
// features/products/pages/products-page.tsx
import type { CreateProductInput } from "@<scope>/contracts/products"
import { Alert, AlertDescription } from "@<scope>/ui/components/alert"
import { Skeleton } from "@<scope>/ui/components/skeleton"
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
