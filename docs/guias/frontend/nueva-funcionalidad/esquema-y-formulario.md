# Esquema y formulario

Anterior: [Layout y página](./layout-y-pagina.md) · [Visión general](./README.md) · Siguiente: [Pruebas](./pruebas.md)

El esquema recorta espacios y exige nombre y descripción. El formulario conecta los campos de shadcn/ui con la librería
de formularios.

```ts
// features/products/schemas/create-product-schema.ts
import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre."),
  description: z.string().trim().min(1, "Escribe una descripción."),
})
```

```tsx
// features/products/components/forms/create-product-form.tsx
import type { CreateProductInput } from "@<scope>/contracts/products"
import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"
import { Alert, AlertDescription } from "@<scope>/ui/components/alert"
import { Button } from "@<scope>/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@<scope>/ui/components/field"
import { Input } from "@<scope>/ui/components/input"
import { Textarea } from "@<scope>/ui/components/textarea"
import { createProductSchema } from "../../schemas/create-product-schema"

type CreateProductFormProps = {
  onSubmit: (values: CreateProductInput) => Promise<void>
}

export function CreateProductForm({ onSubmit }: CreateProductFormProps) {
  const nameId = useId()
  const descriptionId = useId()
  const {
    register,
    handleSubmit: submitForm,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
  })

  return (
    <form
      onSubmit={submitForm(async (values) => {
        try {
          await onSubmit(values)
        } catch {
          setError("root.server", {
            message: "No se pudo guardar el producto.",
          })
        }
      })}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={nameId}>Nombre</FieldLabel>
          <Input
            id={nameId}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            {...register("name")}
          />
          <FieldError id={`${nameId}-error`}>{errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor={descriptionId}>Descripción</FieldLabel>
          <Textarea
            id={descriptionId}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
            {...register("description")}
          />
          <FieldError id={`${descriptionId}-error`}>{errors.description?.message}</FieldError>
        </Field>
        {errors.root?.server?.message && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.server.message}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Guardar producto
        </Button>
      </FieldGroup>
    </form>
  )
}
```
