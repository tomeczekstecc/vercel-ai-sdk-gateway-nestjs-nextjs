import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: app.get(ConfigService).getOrThrow('UI_URL'),
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
