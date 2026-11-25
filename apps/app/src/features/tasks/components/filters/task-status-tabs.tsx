import { Tabs, TabsList, TabsTrigger } from "@autana/ui/components/tabs"

import type { TaskStatusFilter } from "../../hooks/use-task-filters"
import { taskStatusLabels } from "../task-status-labels"

const options: { value: TaskStatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...Object.entries(taskStatusLabels).map(([value, label]) => ({ value: value as TaskStatusFilter, label })),
]

type TaskStatusTabsProps = {
  value: TaskStatusFilter
  onChange: (value: TaskStatusFilter) => void
}

export function TaskStatusTabs({ value, onChange }: TaskStatusTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as TaskStatusFilter)}>
      <TabsList>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
