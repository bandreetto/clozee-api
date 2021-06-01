import * as dotenv from 'dotenv';
dotenv.config();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './config/configuration';
import throng from 'throng';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app
    .listen(configuration.port())
    .then(() => Logger.log(`Server is listening on port ${configuration.port()}`, 'NestApplication'));
}

throng({
  workers: configuration.concurrency.workers() || 1,
  lifetime: Infinity,
  start: bootstrap,
});
