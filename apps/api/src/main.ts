import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const allowedOrigins = [
    configService.getOrThrow<string>('APP_URL'),
    'http://localhost:3000',
  ];
  app.enableCors({ origin: [...new Set(allowedOrigins)] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(configService.getOrThrow<number>('PORT'), '0.0.0.0');
}
void bootstrap();
