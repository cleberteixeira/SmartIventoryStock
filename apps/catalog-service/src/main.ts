import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Catalog Service API')
    .setDescription('Gestão de Catálogo de Produtos - ERP WMS')
    .setVersion('1.0')
    .addTag('products')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
  console.log(`[Catalog Service] is running on: http://localhost:3001/api/docs`);
}
bootstrap();