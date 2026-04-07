import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(global as any).crypto = crypto;

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // ← mostrar todos los logs
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3028;

  app.setGlobalPrefix('api/v1');

  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}/api/v1`);
}

bootstrap();
