import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { AllowAnonymous } from "@thallesp/nestjs-better-auth"
import { healthResponseSchema } from "@autana/contracts/health"

import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js"

@ApiTags("health")
@AllowAnonymous()
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Comprueba que la API está disponible" })
  @ResponseSchema(healthResponseSchema)
  check() {
    return { status: "ok" }
  }
}
