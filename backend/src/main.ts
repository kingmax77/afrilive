import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger API docs ──────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Afrimarket API')
    .setDescription(
      'AfriLive Market + SmartAddress — backend REST API.\n\n' +
        'Authenticate via POST /api/v1/auth/verify-otp, then click **Authorize** and paste the returned JWT token.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Phone OTP authentication')
    .addTag('Addresses', 'SmartAddress management')
    .addTag('Products', 'Seller product catalogue')
    .addTag('Streams', 'Live-commerce broadcast sessions')
    .addTag('Orders', 'Purchase orders & fulfilment')
    .addTag('Delivery', 'Rider GPS tracking & delivery updates')
    .addTag('Payments', 'Flutterwave payment gateway')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Afrimarket API running on http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at   http://localhost:${port}/api/docs`);
}
bootstrap();
