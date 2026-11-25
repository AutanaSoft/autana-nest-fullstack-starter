import { Body, Controller, Get, Put, UsePipes } from "@nestjs/common"
import { ApiBadRequestResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger"
import { errorResponseSchema } from "@autana/contracts/errors"
import { profileSchema, updateProfileSchema, type UpdateProfileValues } from "@autana/contracts/profile"

import { ContractValidationPipe } from "../../common/pipes/contract-validation.pipe.js"
import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js"
import { CurrentUserId } from "../auth/decorators/current-user-id.decorator.js"
import { ProfileService } from "./services/profile.service.js"

@ApiTags("profile")
@ApiUnauthorizedResponse({
  description: "Sin sesión válida",
  standardSchema: errorResponseSchema,
})
@Controller("profile")
@UsePipes(
  new ContractValidationPipe({
    body: { code: "INVALID_PROFILE", message: "Invalid profile" },
  })
)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: "Obtiene el perfil de la cuenta" })
  @ResponseSchema(profileSchema)
  get(@CurrentUserId() userId: string) {
    return this.profileService.get(userId)
  }

  @Put()
  @ApiOperation({
    summary: "Guarda el perfil de la cuenta, reemplazando el anterior",
  })
  @ApiBadRequestResponse({
    description: "Datos inválidos",
    standardSchema: errorResponseSchema,
  })
  @ResponseSchema(profileSchema)
  save(@CurrentUserId() userId: string, @Body({ schema: updateProfileSchema }) values: UpdateProfileValues) {
    return this.profileService.save(userId, values)
  }
}
