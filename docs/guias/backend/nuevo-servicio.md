# Dividir un servicio por responsabilidad

Ejemplo genérico que aplica
[Responsabilidad de los servicios](../../arquitectura/08-conceptos-transversales.md#responsabilidad-de-los-servicios),
con `<resource>` y `<related>` para dos conceptos de dominio distintos.

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
    @Session() session: UserSession,
    @Body({ schema: create<Related>Schema }) values: Create<Related>Values
  ) {
    const created = await this.<related>Service.create(session.user.id, values)
    await this.paymentsService.charge(created)
    await this.notificationsService.send<Related>Confirmation(created)
    return created
  }
}
```

Registra los servicios en `providers` de `<related>.module.ts`. Las pruebas de cada servicio están en
[Escribir una prueba en el backend](./nueva-prueba.md).
