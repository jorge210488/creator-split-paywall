import { DataSource, DataSourceOptions } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";

config();

const configService = new ConfigService();

export const typeOrmConfig: DataSourceOptions = {
  type: "postgres",
  url: configService.get("DATABASE_URL"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  synchronize: false, // Always false for production safety
  logging: configService.get("NODE_ENV") !== "production",
  migrationsRun: false,
};

// DataSource for CLI migrations
export const AppDataSource = new DataSource(typeOrmConfig);
