import { Controller, Get, Res, ServiceUnavailableException } from "@nestjs/common"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import {
  DiskHealthIndicator,
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  type HealthIndicatorFunction,
  MemoryHealthIndicator,
} from "@nestjs/terminus"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"
import { healthResponseSchema } from "@autana/contracts/health"
import type { Response } from "express"

import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js"
import { DatabaseHealthIndicator } from "./indicators/database.health.js"

// Umbrales del detalle de salud. Son orientativos para la plantilla: ajústalos a los recursos de tu despliegue.
const databaseTimeout = "1s"
const heapThreshold = "512mb"
const rssThreshold = "1gb"
const diskThresholdPercent = 0.9
// En contenedores o en Windows puede hacer falta otra ruta.
const diskPath = "/"

// `@HealthCheck` se usa solo por la cabecera sin caché: la documentación la declara `@ResponseSchema` con el contrato.
const healthCheck = () => HealthCheck({ swaggerDocumentation: false })

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator
  ) {}

  @Get("live")
  @AllowAnonymous()
  @healthCheck()
  @ApiOperation({ summary: "Comprueba que el proceso responde (liveness)" })
  @ResponseSchema(healthResponseSchema)
  live() {
    return this.health.check([])
  }

  @Get("ready")
  @AllowAnonymous()
  @healthCheck()
  @ApiOperation({ summary: "Comprueba que la API puede atender peticiones (readiness)" })
  @ResponseSchema(healthResponseSchema)
  @ApiResponse({ status: 503, standardSchema: healthResponseSchema })
  ready(@Res({ passthrough: true }) response: Response) {
    return this.run(response, [() => this.database.pingCheck("database").withTimeout(databaseTimeout)])
  }

  @Get()
  @healthCheck()
  @ApiOperation({ summary: "Detalle de la salud de la API: base de datos, memoria y disco" })
  @ResponseSchema(healthResponseSchema)
  @ApiResponse({ status: 503, standardSchema: healthResponseSchema })
  check(@Res({ passthrough: true }) response: Response) {
    return this.run(response, [
      () => this.database.pingCheck("database").withTimeout(databaseTimeout),
      () => this.memory.checkHeap("memory_heap", heapThreshold),
      () => this.memory.checkRSS("memory_rss", rssThreshold),
      () => this.disk.checkStorage("disk", { path: diskPath, thresholdPercent: diskThresholdPercent }),
    ])
  }

  // Terminus lanza un 503 con el resultado cuando algo falla. El filtro global de errores lo sustituiría por el
  // contrato de error, así que se devuelve aquí el mismo cuerpo con el código 503 para que el cliente vea el detalle.
  private async run(response: Response, indicators: HealthIndicatorFunction[]): Promise<HealthCheckResult> {
    try {
      return await this.health.check(indicators)
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) throw error
      response.status(503)
      return error.getResponse() as HealthCheckResult
    }
  }
}
