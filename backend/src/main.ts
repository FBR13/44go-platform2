import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  
  // 1. CORS Flexível: Aceita localhost (desenvolvimento) e o seu domínio da Vercel (produção)
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Variável que criaremos na nuvem (ex: https://44go.vercel.app)
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // 2. Porta Dinâmica: A nuvem injeta process.env.PORT. Se não existir, cai para 3333 local.
  const port = process.env.PORT || 3333;
  await app.listen(port);
  
  console.log(`Backend 44Go rodando na porta: ${port}`);
}
bootstrap();