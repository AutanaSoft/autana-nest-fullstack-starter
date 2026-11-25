import type { Task, TaskStatus } from "@autana/contracts/tasks"
import { Button } from "@autana/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@autana/ui/components/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@autana/ui/components/table"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { taskStatusItems } from "../task-status-labels"

type TaskListProps = {
  tasks: Task[]
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList({ tasks, onStatusChange, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No hay tareas que mostrar.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead className="w-48">Estado</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="whitespace-normal">
              <p className="font-medium">{task.title}</p>
              {task.description && <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
            </TableCell>
            <TableCell>
              <Select
                items={taskStatusItems}
                value={task.status}
                onValueChange={(status) => onStatusChange(task, status as TaskStatus)}
              >
                <SelectTrigger size="sm" className="w-full" aria-label={`Estado de ${task.title}`}>
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
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon-sm" onClick={() => onEdit(task)}>
                <PencilIcon />
                <span className="sr-only">Editar {task.title}</span>
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onDelete(task)}>
                <Trash2Icon />
                <span className="sr-only">Eliminar {task.title}</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
