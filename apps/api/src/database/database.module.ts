import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig } from "../config/configuration";
import { InitialModelingSchema1760961600000 } from "./migrations/1760961600000-InitialModelingSchema";
import { SimulationRuns1760961700000 } from "./migrations/1760961700000-SimulationRuns";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const database = config.get("database", { infer: true });
        return {
          type: "postgres" as const,
          host: database.host,
          port: database.port,
          username: database.user,
          password: database.password,
          database: database.name,
          autoLoadEntities: true,
          synchronize: false,
          migrations: [InitialModelingSchema1760961600000, SimulationRuns1760961700000],
          migrationsRun: true,
          logging: config.get("nodeEnv", { infer: true }) === "development" ? ["error" as const] : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
