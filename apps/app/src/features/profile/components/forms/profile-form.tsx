import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"
import {
  updateProfileSchema,
  type Profile,
  type ProfileFormValues,
  type UpdateProfileValues,
} from "@autana/contracts/profile"
import { Button } from "@autana/ui/components/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@autana/ui/components/field"
import { Input } from "@autana/ui/components/input"

type ProfileFormProps = {
  profile: Profile
  onSubmit: (values: UpdateProfileValues) => Promise<void>
}

// Los campos sin valor llegan como `null`; los inputs necesitan texto.
function toFormValues(profile: Profile): ProfileFormValues {
  return {
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    addressReference: profile.addressReference ?? "",
    alternateContactName: profile.alternateContactName ?? "",
    alternateContactPhone: profile.alternateContactPhone ?? "",
  }
}

export function ProfileForm({ profile, onSubmit }: ProfileFormProps) {
  const id = useId()
  const {
    register,
    handleSubmit: submitForm,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ProfileFormValues, unknown, UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: toFormValues(profile),
  })

  const fields = [
    { name: "phone", label: "Teléfono", type: "tel", autoComplete: "tel" },
    { name: "address", label: "Dirección", type: "text", autoComplete: "street-address" },
    { name: "addressReference", label: "Referencia de la dirección", type: "text", autoComplete: "off" },
    { name: "alternateContactName", label: "Nombre del contacto alternativo", type: "text", autoComplete: "off" },
    { name: "alternateContactPhone", label: "Teléfono del contacto alternativo", type: "tel", autoComplete: "off" },
  ] as const

  return (
    <form
      noValidate
      onSubmit={submitForm(async (values) => {
        try {
          await onSubmit(values)
        } catch {
          setError("root.server", { message: "No se pudo guardar el perfil. Inténtalo de nuevo." })
        }
      })}
    >
      <FieldGroup>
        {fields.map(({ name, label, type, autoComplete }) => (
          <Field key={name} data-invalid={Boolean(errors[name])}>
            <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
            <Input
              id={`${id}-${name}`}
              type={type}
              autoComplete={autoComplete}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
              {...register(name)}
            />
            <FieldError id={`${id}-${name}-error`}>{errors[name]?.message}</FieldError>
          </Field>
        ))}
        <FieldError>{errors.root?.server?.message}</FieldError>
        {isSubmitSuccessful && <FieldDescription role="status">Perfil guardado.</FieldDescription>}
        <Button type="submit" disabled={isSubmitting} className="self-start">
          Guardar perfil
        </Button>
      </FieldGroup>
    </form>
  )
}
