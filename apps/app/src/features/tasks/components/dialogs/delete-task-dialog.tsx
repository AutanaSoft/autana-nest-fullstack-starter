import type { Task } from "@autana/contracts/tasks"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@autana/ui/components/alert-dialog"

type DeleteTaskDialogProps = {
  task: Task | null
  onOpenChange: (open: boolean) => void
  onConfirm: (task: Task) => void
}

export function DeleteTaskDialog({ task, onOpenChange, onConfirm }: DeleteTaskDialogProps) {
  return (
    <AlertDialog open={task !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar la tarea?</AlertDialogTitle>
          <AlertDialogDescription>Se eliminará «{task?.title}» y no se podrá recuperar.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => task && onConfirm(task)}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
