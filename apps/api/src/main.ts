import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const DEFAULT_API_PORT = 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? DEFAULT_API_PORT);
  await app.listen(port);
}

void bootstrap();
