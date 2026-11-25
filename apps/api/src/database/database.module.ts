import { Module } from "@nestjs/common"
import { DrizzleModule } from "@nestjs/drizzle"
import { createDatabase } from "@autana/database/client"

import { databaseConfig, type DatabaseConfig } from "../config/database.config.js"

// El cliente de `pg` se cierra al apagar la aplicación: lo gestiona `DrizzleModule` (`autoCloseConnection`).
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: DatabaseConfig) => ({
        db: createDatabase(config.DATABASE_URL).db,
      }),
    }),
  ],
})
export class DatabaseModule {}
