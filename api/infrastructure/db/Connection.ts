import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";
import { env } from "../config/env";

const ssl = env.DB_SSL ? { rejectUnauthorized: false } : false;

// DATABASE_URL (Supabase/producción) tiene prioridad sobre los campos sueltos (Postgres local)
const connectionOptions: DataSourceOptions = env.DATABASE_URL
  ? { type: "postgres", url: env.DATABASE_URL, ssl }
  : {
      type: "postgres",
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      ssl,
    };

export const AppDataSource = new DataSource({
  ...connectionOptions,
  synchronize: false,
  logging: env.DB_LOGGING,
  entities: [join(__dirname, "../../core/entities/*{.ts,.js}")],
  migrations: [join(__dirname, "./migrations/*{.ts,.js}")],
  subscribers: [],
});

export const getDataSource = () => AppDataSource;
