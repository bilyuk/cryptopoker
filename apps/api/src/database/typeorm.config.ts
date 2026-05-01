import type { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function createTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    type: "postgres",
    url: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? "cryptopoker",
    password: process.env.POSTGRES_PASSWORD ?? "cryptopoker",
    database: process.env.POSTGRES_DB ?? "cryptopoker",
    autoLoadEntities: true,
    synchronize: false,
  };
}
