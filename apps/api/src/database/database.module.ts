import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createTypeOrmOptions } from "./typeorm.config.js";

@Module({
  imports: process.env.NODE_ENV === "test"
    ? []
    : [
        TypeOrmModule.forRootAsync({
          useFactory: createTypeOrmOptions,
        }),
      ],
})
export class DatabaseModule {}
