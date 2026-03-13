import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './modules/realtime/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Configure Redis adapter for Socket.io (enables horizontal scaling)
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  
  // CORS (before static assets so headers apply to file responses too)
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:3000';
  const corsOrigins = configService.get('CORS_ORIGINS');
  const origins = corsOrigins
    ? corsOrigins.split(',').map((o: string) => o.trim())
    : [frontendUrl, 'http://192.168.1.68'];
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve uploaded files statically
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    exceptionFactory: (errors) => {
      console.error('[ValidationPipe] Validation failed:', JSON.stringify(errors, null, 2));
      return new BadRequestException(errors);
    },
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EITEK Platform API')
    .setDescription('EITEK IoT Platform Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  console.log(`🚀 EITEK Platform API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();