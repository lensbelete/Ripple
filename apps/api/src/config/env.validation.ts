import { plainToInstance } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsOptional()
  @IsIn(["development", "test", "production"])
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  API_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  API_PORT?: number;

  @IsString()
  DATABASE_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT!: number;

  @IsString()
  DATABASE_USER!: string;

  @IsString()
  DATABASE_PASSWORD!: string;

  @IsString()
  DATABASE_NAME!: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsUrl({ require_tld: false })
  SIMULATION_ENGINE_URL!: string;

  @IsOptional()
  @IsInt()
  @Min(200)
  @Max(15000)
  HEALTH_TIMEOUT_MS?: number;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  AUTH_COOKIE_NAME?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validated;
}
