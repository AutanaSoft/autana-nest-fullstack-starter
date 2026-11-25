# Definir una ruta en el backend

Ejemplo genérico de una operación con `<resource>` y `<action>`, que ilustra las reglas de
[Conceptos transversales](../../arquitectura/08-conceptos-transversales.md). La implementación de referencia incluida en
la plantilla es `apps/api/src/modules/tasks/`.

## Controlador

El controlador solo traduce HTTP: valida la entrada con los esquemas del contrato, llama al servicio y declara el
esquema de la respuesta.

```ts
// modules/<resource>/<resource>.controller.ts
@ApiTags("<resource>")
@ApiUnauthorizedResponse({ description: "Sin sesión válida", standardSchema: errorResponseSchema })
@Controller("<resource>")
@UsePipes(
  new ContractValidationPipe({
    param: { code: "INVALID_<RESOURCE>_ID", message: "Invalid <resource> id" },
    body: { code: "INVALID_<RESOURCE>", message: "Invalid <resource>" },
  })
)
export class <Resource>Controller {
  constructor(private readonly <resource>Service: <Resource>Service) {}

  @Patch(":resourceId/<action>")
  @ApiOperation({ summary: "<Descripción de la operación>" })
  @ApiBadRequestResponse({ description: "Identificador inválido", standardSchema: errorResponseSchema })
  @ApiNotFoundResponse({ description: "Recurso ajeno", standardSchema: errorResponseSchema })
  @ApiConflictResponse({ description: "El recurso cambió", standardSchema: errorResponseSchema })
  @ResponseSchema(<action>ResponseSchema)
  <action>(
    @CurrentUserId() userId: string,
    @Param("resourceId", { schema: resourceIdSchema }) resourceId: string
  ) {
    return this.<resource>Service.<action>(userId, resourceId)
  }
}
```

- `@ResponseSchema(schema, status)` serializa la respuesta con el esquema y lo publica en la documentación. El estado
  por defecto es `200`; una creación indica `201`.
- Si el esquema debe aparecer con nombre en `components.schemas`, añádelo a `src/common/openapi/openapi-schemas.ts`.
- Un `DELETE` sin cuerpo usa `@HttpCode(204)` y `@ApiNoContentResponse()` en lugar de `@ResponseSchema`.
- Con un cuerpo, añade `@Body({ schema: <action>Schema }) values: <Action>Values` y el error `INVALID_<RESOURCE>` del
  pipe lo cubre.

## Servicio

El servicio contiene las consultas y las reglas. Lanza excepciones de Nest con el código público de la operación y
devuelve el valor en el tipo del contrato; la serialización la hace el interceptor.

```ts
// modules/<resource>/services/<resource>.service.ts
@Injectable()
export class <Resource>Service {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async <action>(userId: string, resourceId: string) {
    const [resource] = await this.db
      .select()
      .from(resources)
      .where(and(eq(resources.id, resourceId), eq(resources.userId, userId)))
      .limit(1)
    if (!resource) throw new NotFoundException({ code: "RESOURCE_NOT_FOUND", message: "Resource not found" })

    // El WHERE repite el propietario y el estado para resolver las operaciones concurrentes.
    const [updated] = await this.db
      .update(resources)
      .set({ /* cambios */ })
      .where(and(eq(resources.id, resourceId), eq(resources.userId, userId), eq(resources.status, resource.status)))
      .returning({ id: resources.id })
    if (!updated) throw new ConflictException({ code: "RESOURCE_CHANGED", message: "Resource changed" })

    return { id: updated.id }
  }
}
```

## Montar el módulo

El módulo declara el controlador y el servicio. Si las respuestas del módulo no deben guardarse, registra `noStore` con
`configure`: los middlewares del módulo se ejecutan antes que el guard de sesión, por lo que también alcanza a su `401`.
Toda ruta exige sesión salvo que se marque con `@Public()`.

```ts
// modules/<resource>/<resource>.module.ts
@Module({ controllers: [<Resource>Controller], providers: [<Resource>Service] })
export class <Resource>Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(noStore).forRoutes(<Resource>Controller)
  }
}
```

Después se añade a `imports` de `AppModule` (`src/app.module.ts`). Los imports relativos terminan en `.js`.
