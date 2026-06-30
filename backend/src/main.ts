import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,      // Tự loại bỏ các field không có trong DTO
    forbidNonWhitelisted: true, // Báo lỗi nếu gửi field lạ
    transform: true,      // Tự convert kiểu dữ liệu
  }));

  app.enableCors(); // Cho phép frontend gọi API

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
