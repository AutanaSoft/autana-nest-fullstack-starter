import { Alert, AlertDescription } from "@autana/ui/components/alert"
import { Badge } from "@autana/ui/components/badge"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@autana/ui/components/card"
import { Skeleton } from "@autana/ui/components/skeleton"

import { overallStatusLabels } from "../components/health-labels"
import { IndicatorCard } from "../components/indicator-card"
import { useHealthQuery } from "../hooks/use-health-query"

const timeFormat = new Intl.DateTimeFormat("es", { timeStyle: "medium" })

export function StatusPage() {
  const health = useHealthQuery()

  if (health.isPending) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (health.isError) {
    return (
      <div className="px-4 py-4 md:py-6 lg:px-6">
        <Alert variant="destructive">
          <AlertDescription>No pudimos consultar el estado de la API. Inténtalo de nuevo.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { status, details } = health.data

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardDescription>Estado de la API</CardDescription>
            <CardTitle className="text-2xl font-semibold">{overallStatusLabels[status]}</CardTitle>
            <CardAction>
              <Badge variant={status === "ok" ? "outline" : "destructive"}>{status}</Badge>
            </CardAction>
            <CardDescription>
              Actualizado a las {timeFormat.format(health.dataUpdatedAt)}. Se actualiza cada 30 segundos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Object.entries(details).map(([name, indicator]) => (
          <IndicatorCard key={name} name={name} indicator={indicator} />
        ))}
      </div>
    </div>
  )
}
