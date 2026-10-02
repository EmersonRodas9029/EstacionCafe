import "../supabase/loadEnv";
import { DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const useSsl = process.env.DB_SSL !== "false";

if (!databaseUrl && (!process.env.DB_HOST || !process.env.DB_USERNAME)) {
  throw new Error(
    "Falta la conexión PostgreSQL. Define SUPABASE_DB_URL en api/.env.",
  );
}

const connectionOptions: DataSourceOptions = databaseUrl
  ? {
      type: "postgres",
      url: databaseUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      type: "postgres",
      host: process.env.SUPABASE_DB_HOST || process.env.DB_HOST,
      port: Number(process.env.SUPABASE_DB_PORT || process.env.DB_PORT || 5432),
      username: process.env.SUPABASE_DB_USER || process.env.DB_USERNAME,
      password: process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD,
      database: process.env.SUPABASE_DB_NAME || process.env.DB_DATABASE || "postgres",
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    };

export const AppDataSource = new DataSource({
  ...connectionOptions,
  synchronize: false,
  logging: process.env.DB_LOGGING === "true",
  entities: [join(__dirname, "../../core/entities/*{.ts,.js}")],
  migrations: [join(__dirname, "./migrations/*{.ts,.js}")],
  subscribers: [],
});

export const getDataSource = () => AppDataSource;
