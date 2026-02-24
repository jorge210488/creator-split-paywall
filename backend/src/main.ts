import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with safer defaults in production
  const nodeEnv = process.env.NODE_ENV || "development";
  const corsOriginEnv = process.env.CORS_ORIGIN;
  // Support comma-separated origins in env (e.g., "http://localhost:8080,http://localhost:4173")
  const parsedOrigins =
    corsOriginEnv && corsOriginEnv.includes(",")
      ? corsOriginEnv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => !!s)
      : corsOriginEnv;
  const corsOrigin =
    nodeEnv === "production"
      ? parsedOrigins || false // disable CORS if not explicitly configured
      : parsedOrigins || "*"; // dev default

  app.enableCors({
    origin: corsOrigin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger configuration (disabled by default in production)
  const swaggerEnabled =
    (process.env.SWAGGER_ENABLED || "true").toLowerCase() === "true";

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle("Creator Split Paywall API")
      .setDescription(
        "Blockchain-powered subscription platform with automatic payment splitting"
      )
      .setVersion("1.0")
      .addTag("subscriptions", "Subscription status and history endpoints")
      .addTag("webhooks", "Webhook endpoints for external services")
      .addTag("health", "Health check endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
