# Pruebas

Anterior: [Esquema y formulario](./esquema-y-formulario.md) · [Visión general](./README.md)

Los niveles y su criterio están en [Pruebas](../../../arquitectura/08-conceptos-transversales.md#pruebas). Cada prueba
vive junto al archivo que prueba. Las peticiones HTTP se simulan con MSW: cada prueba declara con `server.use(...)` las
respuestas que necesita, y una petición sin respuesta declarada hace fallar la prueba.

## Unitaria de `api/`

Prueba la función con la petición simulada y comprueba la respuesta y los errores.

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

Renderiza el componente y comprueba lo que ve y hace la persona usuaria, no su implementación interna. Busca los
elementos por su rol o su etiqueta.

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

## Con sesión

Un layout o una página que lee la sesión, como `PanelLayout`, depende de un estado global al módulo del cliente de
autenticación. Declara la sesión con `mockSession` antes de renderizar, para que la prueba no herede el estado de la
anterior:

```tsx
// features/products/layouts/products-layout.test.tsx
import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { mockSession } from "@/test/mock-session"

import { ProductsLayout } from "./products-layout"

function renderLayout() {
  const router = createMemoryRouter(
    [
      { path: "/products", element: <ProductsLayout />, children: [{ index: true, element: <p>Contenido</p> }] },
      { path: "/auth", element: <p>Acceso</p> },
    ],
    { initialEntries: ["/products"] }
  )
  render(<RouterProvider router={router} />)
}

describe("ProductsLayout", () => {
  it("redirige a la pantalla de acceso cuando no hay sesión", async () => {
    await mockSession(null)

    renderLayout()

    expect(await screen.findByText("Acceso")).toBeInTheDocument()
  })

  it("muestra el contenido cuando hay sesión", async () => {
    await mockSession({ user: { id: "1", name: "Ana Ruiz" }, session: { id: "s1" } })

    renderLayout()

    expect(await screen.findByText("Contenido")).toBeInTheDocument()
  })
})
```

## Ejecutarlas

`npm test` ejecuta las pruebas de todos los workspaces. Para ejecutar solo las del frontend, usa `npm test -w app`.
