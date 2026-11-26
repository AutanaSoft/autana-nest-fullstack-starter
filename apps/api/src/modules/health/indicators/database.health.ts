import { Injectable } from "@nestjs/common"
import { InjectDrizzle } from "@nestjs/drizzle"
import { HealthIndicatorService } from "@nestjs/terminus"
import { sql } from "drizzle-orm"

import type { Database } from "../../../database/database.js"

// Terminus no incluye un indicador para Drizzle: este comprueba la conexión con una consulta mínima.
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  pingCheck(key: string) {
    return this.healthIndicatorService.check(key).attempt(() => this.db.execute(sql`select 1`))
  }
}
