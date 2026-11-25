# Dividir un servicio por responsabilidad

Ejemplo genérico de cómo repartir la lógica de un módulo en servicios con una sola responsabilidad. Aplica la regla de
[Responsabilidad de los servicios](../../arquitectura/05-vista-de-bloques.md#responsabilidad-de-los-servicios). El
ejemplo usa `<resource>` y `<related>` para dos conceptos de dominio distintos.

## Cuándo dividir

Divide un servicio cuando:

- su nombre contiene "y", como `<Resource>And<Related>Service`;
- inyecta dependencias que solo usa una parte de sus métodos;
- sus pruebas necesitan muchos dobles.

Si la lógica es sencilla y pertenece a un solo concepto, déjala en su servicio.

## Antes: un servicio con varias responsabilidades

```ts
// Evitar: mezcla dos conceptos de dominio y la coordinación de un caso de uso.
@Injectable()
export class <Resource>And<Related>Service {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService
  ) {}

  async create<Related>(userId: string, values: Create<Related>Values) {
    const [created] = await this.db.insert(<related>).values({ ...values, userId }).returning()
    await this.payments.charge(created)
    await this.notifications.send<Related>Confirmation(created)
    return created
  }

  // ...más métodos de <resource>, de <related> y de estadísticas
}
```

## Después: un servicio por concepto

Cada servicio se ocupa de un concepto y no conoce a los demás.

```ts
// modules/<related>/services/<related>.service.ts
@Injectable()
export class <Related>Service {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async create(userId: string, values: Create<Related>Values): Promise<<Related>> {
    const [created] = await this.db.insert(<related>).values({ ...values, userId }).returning()
    return to<Related>(created)
  }
}
```

```ts
// modules/<related>/services/<related>-stats.service.ts
@Injectable()
export class <Related>StatsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async calculateForUser(userId: string) {
    // Consulta y cálculo de las estadísticas.
  }
}
```

## Coordinar un caso de uso en el controlador

El controlador llama a cada servicio en orden. No toma decisiones de negocio: las reglas siguen en los servicios.

```ts
// modules/<related>/<related>.controller.ts
@Controller("<related>")
export class <Related>Controller {
  constructor(
    private readonly <related>Service: <Related>Service,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Post()
  @ResponseSchema(<related>Schema, 201)
  async create(
    @CurrentUserId() userId: string,
    @Body({ schema: create<Related>Schema }) values: Create<Related>Values
  ) {
    const created = await this.<related>Service.create(userId, values)
    await this.paymentsService.charge(created)
    await this.notificationsService.send<Related>Confirmation(created)
    return created
  }
}
```

- Las consultas se quedan en el servicio. Extrae una a un repositorio (`repositories/<related>.repository.ts`) solo
  cuando sea compleja o la reutilicen varios servicios. Ese repositorio recibe el cliente con `@InjectDrizzle()` y no
  participa en una transacción abierta con `tx`, salvo que la propagues con `AsyncLocalStorage`. Consulta la
  [decisión](../../arquitectura/09-decisiones.md).
- Los módulos no se importan entre sí. Un servicio que usan varios módulos sube a `common/`. Consulta las
  [reglas de dependencia](../../arquitectura/05-vista-de-bloques.md#reglas-de-dependencia).
- Registra todos los servicios del módulo en `providers` de `<related>.module.ts`.
- Cada servicio se prueba por separado con pocos dobles. Consulta
  [Escribir una prueba en el backend](./nueva-prueba.md).
