import { Client } from "pg";
import { AppDataSource } from "../../infrastructure/db/Connection";
import { env } from "../../infrastructure/config/env";

/** Crea la BD de pruebas si no existe y aplica las migraciones. */
export const setupTestDatabase = async () => {
  const admin = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: "postgres",
  });
  await admin.connect();
  const exists = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [env.DB_DATABASE],
  );
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${env.DB_DATABASE}"`);
  }
  await admin.end();

  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  return AppDataSource;
};

/** Vacía todas las tablas de dominio entre pruebas. */
export const resetTables = async () => {
  const tables = AppDataSource.entityMetadatas
    .map((m) => `"${m.tableName}"`)
    .join(", ");
  await AppDataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
};

export const closeTestDatabase = async () => {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
};
