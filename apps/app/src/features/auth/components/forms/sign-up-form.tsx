import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { Button } from "@autana/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autana/ui/components/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@autana/ui/components/field"
import { Input } from "@autana/ui/components/input"

import { PasswordInput } from "../password-input"
import { signUpSchema, type SignUpValues } from "@autana/contracts/auth"

type SignUpFormProps = {
  onSubmit: (values: SignUpValues) => Promise<void>
}

export function SignUpForm({ onSubmit }: SignUpFormProps) {
  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()
  const {
    register,
    handleSubmit: submitForm,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) })

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
        <CardDescription>Regístrate en Autana Nest Full Stack Starter</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={submitForm(async (values) => {
            try {
              await onSubmit(values)
            } catch (error) {
              setError("root.server", {
                message: error instanceof Error ? error.message : "No se pudo crear la cuenta. Inténtalo de nuevo.",
              })
            }
          })}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor={nameId}>Nombre y apellido</FieldLabel>
              <Input
                id={nameId}
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${nameId}-error` : undefined}
                {...register("name")}
              />
              <FieldError id={`${nameId}-error`}>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor={emailId}>Correo electrónico</FieldLabel>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? `${emailId}-error` : undefined}
                {...register("email")}
              />
              <FieldError id={`${emailId}-error`}>{errors.email?.message}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor={passwordId}>Contraseña</FieldLabel>
              <PasswordInput
                id={passwordId}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                {...register("password")}
              />
              <FieldError id={`${passwordId}-error`}>{errors.password?.message}</FieldError>
            </Field>
            <FieldError>{errors.root?.server?.message}</FieldError>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                Crear cuenta
              </Button>
              <FieldDescription className="text-center">
                ¿Ya tienes cuenta? <Link to="/auth/sign-in">Inicia sesión</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
