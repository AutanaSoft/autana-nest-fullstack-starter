import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UsePipes } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger"
import { errorResponseSchema } from "@autana/contracts/errors"
import {
  createTaskSchema,
  type CreateTaskValues,
  listTasksQuerySchema,
  listTasksResponseSchema,
  type ListTasksQuery,
  taskParamsSchema,
  taskSchema,
  updateTaskSchema,
  type UpdateTaskValues,
} from "@autana/contracts/tasks"

import { ContractValidationPipe } from "../../common/pipes/contract-validation.pipe.js"
import { ResponseSchema } from "../../common/decorators/response-schema.decorator.js"
import { CurrentUserId } from "../auth/decorators/current-user-id.decorator.js"
import { TasksService } from "./services/tasks.service.js"

const taskIdSchema = taskParamsSchema.shape.taskId

const invalidInput = {
  description: "Datos inválidos",
  standardSchema: errorResponseSchema,
}
const taskNotFound = {
  description: "La tarea no existe o no es del usuario",
  standardSchema: errorResponseSchema,
}

@ApiTags("tasks")
@ApiUnauthorizedResponse({
  description: "Sin sesión válida",
  standardSchema: errorResponseSchema,
})
@Controller("tasks")
@UsePipes(
  new ContractValidationPipe({
    param: { code: "INVALID_TASK_ID", message: "Invalid task id" },
    query: { code: "INVALID_TASK_QUERY", message: "Invalid query" },
    body: { code: "INVALID_TASK", message: "Invalid task" },
  })
)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: "Lista las tareas del usuario" })
  @ApiBadRequestResponse(invalidInput)
  @ResponseSchema(listTasksResponseSchema)
  list(@CurrentUserId() userId: string, @Query({ schema: listTasksQuerySchema }) query: ListTasksQuery) {
    return this.tasksService.list(userId, query)
  }

  @Post()
  @ApiOperation({ summary: "Crea una tarea" })
  @ApiBadRequestResponse(invalidInput)
  @ResponseSchema(taskSchema, 201)
  create(@CurrentUserId() userId: string, @Body({ schema: createTaskSchema }) values: CreateTaskValues) {
    return this.tasksService.create(userId, values)
  }

  @Get(":taskId")
  @ApiOperation({ summary: "Obtiene una tarea" })
  @ApiBadRequestResponse(invalidInput)
  @ApiNotFoundResponse(taskNotFound)
  @ResponseSchema(taskSchema)
  get(@CurrentUserId() userId: string, @Param("taskId", { schema: taskIdSchema }) taskId: string) {
    return this.tasksService.get(userId, taskId)
  }

  @Patch(":taskId")
  @ApiOperation({ summary: "Modifica una tarea" })
  @ApiBadRequestResponse(invalidInput)
  @ApiNotFoundResponse(taskNotFound)
  @ResponseSchema(taskSchema)
  update(
    @CurrentUserId() userId: string,
    @Param("taskId", { schema: taskIdSchema }) taskId: string,
    @Body({ schema: updateTaskSchema }) values: UpdateTaskValues
  ) {
    return this.tasksService.update(userId, taskId, values)
  }

  @Delete(":taskId")
  @HttpCode(204)
  @ApiOperation({ summary: "Elimina una tarea" })
  @ApiBadRequestResponse(invalidInput)
  @ApiNotFoundResponse(taskNotFound)
  @ApiNoContentResponse({ description: "Tarea eliminada" })
  async delete(@CurrentUserId() userId: string, @Param("taskId", { schema: taskIdSchema }) taskId: string) {
    await this.tasksService.delete(userId, taskId)
  }
}
