import type { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function createTypeOrmOptions(): TypeOrmModuleOptions {
  const sharedOptions = {
    autoLoadEntities: true,
    synchronize: false,
  } satisfies Partial<TypeOrmModuleOptions>;

  if (process.env.DATABASE_URL) {
    return {
      type: "postgres",
      url: process.env.DATABASE_URL,
      ...sharedOptions,
    };
  }

  return {
    type: "postgres",
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    username: process.env.POSTGRES_USER ?? "cryptopoker",
    password: process.env.POSTGRES_PASSWORD ?? "cryptopoker",
    database: process.env.POSTGRES_DB ?? "cryptopoker",
    ...sharedOptions,
  };
}
