import { useEffect, useState } from "react"
import type { Task, TaskStatus } from "@autana/contracts/tasks"
import { Alert, AlertDescription } from "@autana/ui/components/alert"
import { Button } from "@autana/ui/components/button"
import { Skeleton } from "@autana/ui/components/skeleton"
import { PlusIcon } from "lucide-react"

import { DeleteTaskDialog } from "../components/dialogs/delete-task-dialog"
import { TaskFormDialog } from "../components/dialogs/task-form-dialog"
import { TaskStatusTabs } from "../components/filters/task-status-tabs"
import { TaskList } from "../components/lists/task-list"
import { TaskPagination } from "../components/lists/task-pagination"
import { useCreateTaskMutation } from "../hooks/use-create-task-mutation"
import { useDeleteTaskMutation } from "../hooks/use-delete-task-mutation"
import { useTaskFilters } from "../hooks/use-task-filters"
import { useTasksQuery } from "../hooks/use-tasks-query"
import { useUpdateTaskMutation } from "../hooks/use-update-task-mutation"
import type { TaskFormValues } from "../schemas/task-form-schema"

// `"new"` abre el diálogo para crear; una tarea lo abre para editarla.
type FormTarget = "new" | Task | null

export function TasksPage() {
  const { status, page, setStatus, setPage, getPageSearch } = useTaskFilters()
  const tasks = useTasksQuery({ status: status === "all" ? undefined : status, page })
  const createTask = useCreateTaskMutation()
  const updateTask = useUpdateTaskMutation()
  const deleteTask = useDeleteTaskMutation()
  const [formTarget, setFormTarget] = useState<FormTarget>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [actionFailed, setActionFailed] = useState(false)

  const pageCount = tasks.data ? Math.max(1, Math.ceil(tasks.data.total / tasks.data.pageSize)) : 1
  // Si se elimina la última tarea de la última página, se vuelve a la anterior.
  useEffect(() => {
    if (tasks.data && !tasks.isPlaceholderData && page > pageCount) setPage(pageCount)
  }, [tasks.data, tasks.isPlaceholderData, page, pageCount, setPage])

  async function handleSubmit(values: TaskFormValues) {
    // El estado no se envía al crear: la API siempre crea la tarea en «Por hacer».
    if (formTarget === "new") await createTask.mutateAsync({ title: values.title, description: values.description })
    else if (formTarget) await updateTask.mutateAsync({ taskId: formTarget.id, ...values })
    setFormTarget(null)
  }

  async function runAction(action: () => Promise<unknown>) {
    setActionFailed(false)
    try {
      await action()
    } catch {
      setActionFailed(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TaskStatusTabs value={status} onChange={setStatus} />
        <Button onClick={() => setFormTarget("new")}>
          <PlusIcon />
          Nueva tarea
        </Button>
      </div>
      {actionFailed && (
        <Alert variant="destructive">
          <AlertDescription>No se pudo completar la acción. Inténtalo de nuevo.</AlertDescription>
        </Alert>
      )}
      {tasks.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : tasks.isError ? (
        <Alert variant="destructive">
          <AlertDescription>No pudimos cargar las tareas. Inténtalo de nuevo.</AlertDescription>
        </Alert>
      ) : (
        <>
          <TaskList
            tasks={tasks.data.items}
            onStatusChange={(task, nextStatus: TaskStatus) =>
              runAction(() => updateTask.mutateAsync({ taskId: task.id, status: nextStatus }))
            }
            onEdit={setFormTarget}
            onDelete={setTaskToDelete}
          />
          <TaskPagination page={page} pageCount={pageCount} getPageSearch={getPageSearch} />
        </>
      )}
      <TaskFormDialog
        open={formTarget !== null}
        task={formTarget === "new" || formTarget === null ? undefined : formTarget}
        onOpenChange={(open) => !open && setFormTarget(null)}
        onSubmit={handleSubmit}
      />
      <DeleteTaskDialog
        task={taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onConfirm={(task) => {
          setTaskToDelete(null)
          void runAction(() => deleteTask.mutateAsync(task.id))
        }}
      />
    </div>
  )
}
