import type { HealthIndicator } from "@autana/contracts/health"
import { Badge } from "@autana/ui/components/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@autana/ui/components/card"

import { indicatorLabels, indicatorStatusLabels } from "./health-labels"

type IndicatorCardProps = {
  name: string
  indicator: HealthIndicator
}

export function IndicatorCard({ name, indicator }: IndicatorCardProps) {
  const label = indicatorLabels[name] ?? name

  return (
    <Card className="@container/card" role="group" aria-label={label}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold">{indicatorStatusLabels[indicator.status]}</CardTitle>
        <CardAction>
          <Badge variant={indicator.status === "up" ? "outline" : "destructive"}>{indicator.status}</Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm text-muted-foreground">
        {indicator.message && <p className="text-destructive">{indicator.message}</p>}
        {indicator.responseTime !== undefined && <p>Respuesta en {indicator.responseTime} ms</p>}
      </CardFooter>
    </Card>
  )
}
