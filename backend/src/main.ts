import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

function parseAllowedOrigins(rawOrigins?: string) {
  return (rawOrigins ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const nodeEnv = (process.env.NODE_ENV ?? "development").toLowerCase();
  const isProduction = nodeEnv === "production";
  const allowedOrigins = parseAllowedOrigins(process.env.APP_ORIGIN);
  if (isProduction && allowedOrigins.length === 0) {
    throw new Error("APP_ORIGIN deve ser configurado em producao para restringir origens CORS.");
  }

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy === "1" || trustProxy === "true") {
    expressApp.set("trust proxy", 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("AgroDesk TI API")
    .setDescription("API do sistema interno de Ticket/OS do AgroDesk TI")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = Number(process.env.PORT ?? 3333);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
}

bootstrap();
