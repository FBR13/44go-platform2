import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Configurações de Validação (Essencial para os DTOs funcionarem)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // Dá erro se mandarem campos que não existem no DTO
    }),
  );

  // 2. CORS Liberado: Para o deploy inicial, o melhor é deixar 'true' 
  // Isso permite que qualquer origem (Vercel, localhost, etc) acesse a API.
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // 3. Porta Dinâmica para o Render (Ele usa a variável process.env.PORT)
  const port = process.env.PORT || 3333;
  
  // Importante: 0.0.0.0 força o Nest a ouvir em todas as interfaces de rede, 
  // o que ajuda muito em alguns ambientes de nuvem.
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend 44Go rodando em: http://localhost:${port}/api`);
}
bootstrap();