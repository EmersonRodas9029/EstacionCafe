import { cleanDraftBillsJob } from "./cleanDraftBillsJob";
import { cleanSessionsJob } from "./cleanSessionsJob";

/**
 * Inicia todos los jobs programados de la aplicación
 */
export const startAllJobs = () => {
  console.log("[JobScheduler] Iniciando todos los jobs programados...");

  cleanDraftBillsJob();
  cleanSessionsJob();

  console.log("[JobScheduler] Todos los jobs iniciados correctamente");
};

// Exportar funciones individuales para testing o ejecución manual
export {
  cleanDraftBillsJob,
  runCleanDraftBillsNow,
} from "./cleanDraftBillsJob";
export { cleanSessionsJob, runCleanSessionsNow } from "./cleanSessionsJob";
