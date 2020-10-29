import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app
    .listen(configuration.port())
    .then(() =>
      Logger.log(`Server is listening on port ${configuration.port()}`),
    );
}
bootstrap();
