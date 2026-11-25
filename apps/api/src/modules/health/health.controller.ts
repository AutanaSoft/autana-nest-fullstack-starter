import { Controller, Get } from "@nestjs/common"
import { ApiOperation, ApiTags } from "@nestjs/swagger"
import { healthResponseSchema } from "@autana/contracts/health"

import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js"
import { Public } from "../auth/decorators/public.decorator.js"

@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Comprueba que la API está disponible" })
  @ResponseSchema(healthResponseSchema)
  check() {
    return { status: "ok" }
  }
}
