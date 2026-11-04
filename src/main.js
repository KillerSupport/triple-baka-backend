const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || 3000);
  try {
    await app.listen(port, process.env.HOST || '127.0.0.1');
  } catch (error) {
    await app.close();
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exitCode = 1;
});
