// src/main.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Relay');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // Handle graceful shutdown
  app.enableShutdownHooks();

  process.on('SIGINT', () => {
    logger.log('SIGINT received — shutting down gracefully');
    app
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.log('SIGTERM received — shutting down gracefully');
    app
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  logger.log('CoW DEX Relay started — keeper active');
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
