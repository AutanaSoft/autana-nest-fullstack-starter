import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@autana/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@autana/ui/components/field"
import { Input } from "@autana/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@autana/ui/components/select"
import { Textarea } from "@autana/ui/components/textarea"

import { taskFormSchema, type TaskFormInput, type TaskFormValues } from "../../schemas/task-form-schema"
import { taskStatusItems } from "../task-status-labels"

type TaskFormProps = {
  defaultValues?: TaskFormInput
  // El estado solo se elige al editar: una tarea nueva siempre nace en «Por hacer».
  showStatus: boolean
  submitLabel: string
  onSubmit: (values: TaskFormValues) => Promise<void>
}

export function TaskForm({
  defaultValues = { title: "", description: "", status: "todo" },
  showStatus,
  submitLabel,
  onSubmit,
}: TaskFormProps) {
  const titleId = useId()
  const descriptionId = useId()
  const statusId = useId()
  const {
    register,
    control,
    handleSubmit: submitForm,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInput, unknown, TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues })

  return (
    <form
      noValidate
      onSubmit={submitForm(async (values) => {
        try {
          await onSubmit(values)
        } catch {
          setError("root.server", { message: "No se pudo guardar la tarea. Inténtalo de nuevo." })
        }
      })}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor={titleId}>Título</FieldLabel>
          <Input
            id={titleId}
            autoComplete="off"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? `${titleId}-error` : undefined}
            {...register("title")}
          />
          <FieldError id={`${titleId}-error`}>{errors.title?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor={descriptionId}>Descripción</FieldLabel>
          <Textarea
            id={descriptionId}
            rows={4}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? `${descriptionId}-error` : undefined}
            {...register("description")}
          />
          <FieldError id={`${descriptionId}-error`}>{errors.description?.message}</FieldError>
        </Field>
        {showStatus && (
          <Field>
            <FieldLabel htmlFor={statusId}>Estado</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select items={taskStatusItems} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id={statusId} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskStatusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        )}
        <FieldError>{errors.root?.server?.message}</FieldError>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  )
}
