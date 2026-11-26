# Pruebas

Anterior: [Esquema y formulario](./esquema-y-formulario.md) · [Visión general](./README.md)

Ejemplos que aplican [Pruebas](../../../arquitectura/08-conceptos-transversales.md#pruebas). Cada prueba declara con
`server.use(...)` las respuestas de MSW que necesita.

## Unitaria de `api/`

```ts
// features/products/api/create-product.test.ts
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/test/server"

import { createProduct } from "./create-product"

const values = { name: "Café", description: "Tostado medio" }

describe("createProduct", () => {
  it("devuelve el producto creado, validado contra el contrato", async () => {
    server.use(
      http.post("*/v1/products", () => HttpResponse.json({ id: "1", name: "Café", description: "Tostado medio" }))
    )

    await expect(createProduct(values)).resolves.toMatchObject({ id: "1", name: "Café" })
  })

  it("envía los valores en el cuerpo", async () => {
    let body: unknown
    server.use(
      http.post("*/v1/products", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: "1", name: "Café", description: "Tostado medio" })
      })
    )

    await createProduct(values)

    expect(body).toMatchObject(values)
  })
})
```

## De componente

Busca los elementos por su rol o su etiqueta.

```tsx
// features/products/components/forms/create-product-form.test.tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CreateProductForm } from "./create-product-form"

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<CreateProductForm onSubmit={onSubmit} />)
  return { onSubmit, user: userEvent.setup() }
}

describe("CreateProductForm", () => {
  it("muestra los errores de un formulario vacío y no envía", async () => {
    const { onSubmit, user } = renderForm()

    await user.click(screen.getByRole("button", { name: "Guardar producto" }))

    expect(await screen.findByText("Escribe un nombre.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("envía los valores recortados", async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText("Nombre"), "  Café ")
    await user.type(screen.getByLabelText("Descripción"), "Tostado medio")
    await user.click(screen.getByRole("button", { name: "Guardar producto" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Café", description: "Tostado medio" }))
  })
})
```

## De página

`renderWithProviders` monta la página con un router en memoria y un cliente de consultas sin reintentos.

```tsx
// features/products/pages/products-page.test.tsx
import { screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render-with-providers"
import { server } from "@/test/server"

import { ProductsPage } from "./products-page"

describe("ProductsPage", () => {
  it("muestra los productos", async () => {
    server.use(
      http.get("*/v1/products", () =>
        HttpResponse.json({ items: [{ id: "1", name: "Café", description: "Tostado medio" }], total: 1 })
      )
    )

    renderWithProviders(<ProductsPage />)

    expect(await screen.findByText("Café")).toBeInTheDocument()
  })

  it("lee el filtro de la URL", async () => {
    let status: string | null = null
    server.use(
      http.get("*/v1/products", ({ request }) => {
        status = new URL(request.url).searchParams.get("status")
        return HttpResponse.json({ items: [], total: 0 })
      })
    )

    renderWithProviders(<ProductsPage />, { route: "/?status=archived" })

    await waitFor(() => expect(status).toBe("archived"))
  })

  it("muestra un error cuando no se pueden cargar", async () => {
    server.use(http.get("*/v1/products", () => HttpResponse.json({}, { status: 500 })))

    renderWithProviders(<ProductsPage />)

    expect(await screen.findByText("No pudimos cargar los productos. Inténtalo de nuevo.")).toBeInTheDocument()
  })
})
```

## Ejecutarlas

`npm test` ejecuta las pruebas de todos los workspaces. Para ejecutar solo las del frontend, usa `npm test -w app`.
