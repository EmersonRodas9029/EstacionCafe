/**
 * npm run seed:demo — borra la BD y la llena con 30 días de operación simulada.
 * Solo para desarrollo y demos: se niega en producción y, si hay DATABASE_URL
 * (p. ej. Supabase), exige --yes para evitar accidentes.
 */
import { env } from "../../config/env";
import { AppDataSource } from "../Connection";
import { runDemoSeed } from "./demoSeeder";

const main = async () => {
  if (env.NODE_ENV === "production") {
    throw new Error("seed:demo borra todos los datos: no se ejecuta con NODE_ENV=production");
  }
  if (env.DATABASE_URL && !process.argv.includes("--yes")) {
    throw new Error(
      "Hay DATABASE_URL configurada (¿una BD remota?). seed:demo la borraría: repite con --yes si es intencional.",
    );
  }

  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  const started = Date.now();
  const summary = await runDemoSeed(AppDataSource);
  await AppDataSource.destroy();

  console.log(`\nBD "${env.DB_DATABASE}" regenerada en ${((Date.now() - started) / 1000).toFixed(1)} s`);
  console.log(`  ${summary.days} días · ${summary.bills} cuentas · ${summary.purchases} compras`);
  console.log(`  Estados: ${Object.entries(summary.byStatus).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  Stock bajo: ${summary.lowStock.join(", ") || "ninguno"}`);
  console.log(`\nContraseña de todos: AdminDemo123!  (admin.demo es el administrador)`);
  console.log("PIN (en un dispositivo autorizado desde Admin → Dispositivos):");
  for (const { username, pin } of summary.pins) console.log(`  ${pin}  ${username}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
