import type { Task } from "@autana/contracts/tasks"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@autana/ui/components/dialog"

import type { TaskFormValues } from "../../schemas/task-form-schema"
import { TaskForm } from "../forms/task-form"

type TaskFormDialogProps = {
  open: boolean
  // La tarea que se edita; sin ella, el diálogo crea una nueva.
  task?: Task
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TaskFormValues) => Promise<void>
}

export function TaskFormDialog({ open, task, onOpenChange, onSubmit }: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            {task ? "Modifica el título o el estado." : "Indica qué hay que hacer."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          key={task?.id ?? "new"}
          defaultValues={task && { title: task.title, description: task.description ?? "", status: task.status }}
          showStatus={task !== undefined}
          submitLabel={task ? "Guardar cambios" : "Crear tarea"}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
