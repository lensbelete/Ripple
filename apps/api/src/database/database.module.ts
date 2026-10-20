import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig } from "../config/configuration";

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
          logging: config.get("nodeEnv", { infer: true }) === "development" ? ["error" as const] : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
