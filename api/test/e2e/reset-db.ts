/**
 * Deja la BD de e2e en estado conocido: la recrea, migra y siembra los datos demo.
 * Uso: DB_DATABASE=estacioncafe_e2e npm run e2e:db
 */
import { execSync } from "child_process";
import { Client } from "pg";
import { AppDataSource } from "../../infrastructure/db/Connection";
import { env } from "../../infrastructure/config/env";

const main = async () => {
  if (!/e2e|test/.test(env.DB_DATABASE)) {
    throw new Error(`Por seguridad solo se reinician BDs de prueba (recibí "${env.DB_DATABASE}")`);
  }

  const admin = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: "postgres",
  });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${env.DB_DATABASE}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${env.DB_DATABASE}"`);
  await admin.end();

  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();

  execSync("npm run seed:run", { stdio: "inherit", env: process.env });
  console.log(`BD ${env.DB_DATABASE} lista para e2e`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
