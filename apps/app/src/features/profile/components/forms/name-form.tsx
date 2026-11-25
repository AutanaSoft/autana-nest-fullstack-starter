import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@autana/ui/components/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@autana/ui/components/field"
import { Input } from "@autana/ui/components/input"

import { nameFormSchema, type NameFormValues } from "../../schemas/name-form-schema"

type NameFormProps = {
  name: string
  email: string
  onSubmit: (values: NameFormValues) => Promise<void>
}

export function NameForm({ name, email, onSubmit }: NameFormProps) {
  const nameId = useId()
  const emailId = useId()
  const {
    register,
    handleSubmit: submitForm,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<NameFormValues>({ resolver: zodResolver(nameFormSchema), defaultValues: { name } })

  return (
    <form
      noValidate
      onSubmit={submitForm(async (values) => {
        try {
          await onSubmit(values)
        } catch {
          setError("root.server", { message: "No se pudo guardar el nombre. Inténtalo de nuevo." })
        }
      })}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={nameId}>Nombre</FieldLabel>
          <Input
            id={nameId}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            {...register("name")}
          />
          <FieldError id={`${nameId}-error`}>{errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor={emailId}>Correo electrónico</FieldLabel>
          <Input id={emailId} type="email" value={email} readOnly />
          <FieldDescription>El correo no se puede cambiar.</FieldDescription>
        </Field>
        <FieldError>{errors.root?.server?.message}</FieldError>
        {isSubmitSuccessful && <FieldDescription role="status">Nombre guardado.</FieldDescription>}
        <Button type="submit" disabled={isSubmitting} className="self-start">
          Guardar nombre
        </Button>
      </FieldGroup>
    </form>
  )
}
