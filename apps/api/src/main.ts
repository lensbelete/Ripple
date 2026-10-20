import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AppConfig } from "./config/configuration";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const logger = new Logger("Bootstrap");

  app.setGlobalPrefix("api/v1", { exclude: ["api/docs"] });
  app.use(cookieParser());
  app.enableCors({
    origin: config.get("corsOrigin", { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle("Ripple API")
    .setDescription("Application API for Ripple decision intelligence.")
    .setVersion("0.1.0")
    .addCookieAuth(config.get("authCookieName", { infer: true }))
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));

  const host = config.get("apiHost", { infer: true });
  const port = config.get("apiPort", { infer: true });
  await app.listen(port, host);
  logger.log(`Ripple API listening on http://${host}:${port}`);
  logger.log(`OpenAPI docs available at http://${host}:${port}/api/docs`);
}

void bootstrap();
