import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { Button } from "@autana/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autana/ui/components/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@autana/ui/components/field"
import { Input } from "@autana/ui/components/input"

import { PasswordInput } from "../password-input"
import { signInSchema, type SignInValues } from "@autana/contracts/auth"

type SignInFormProps = {
  onSubmit: (values: SignInValues) => Promise<void>
}

export function SignInForm({ onSubmit }: SignInFormProps) {
  const emailId = useId()
  const passwordId = useId()
  const {
    register,
    handleSubmit: submitForm,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) })

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Inicia sesión</CardTitle>
        <CardDescription>Accede a tu cuenta de Autana Nest Full Stack Starter</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={submitForm(async (values) => {
            try {
              await onSubmit(values)
            } catch (error) {
              setError("root.server", {
                message: error instanceof Error ? error.message : "No se pudo iniciar sesión. Inténtalo de nuevo.",
              })
            }
          })}
        >
          <FieldGroup>
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
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                {...register("password")}
              />
              <FieldError id={`${passwordId}-error`}>{errors.password?.message}</FieldError>
            </Field>
            <FieldError>{errors.root?.server?.message}</FieldError>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                Iniciar sesión
              </Button>
              <FieldDescription className="text-center">
                ¿No tienes cuenta? <Link to="/auth/sign-up">Regístrate</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
