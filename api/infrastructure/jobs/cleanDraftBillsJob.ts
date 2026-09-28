import * as cron from "node-cron";
import { AppDataSource } from "../db/Connection";
import { Bill } from "../../core/entities/Bill";
import { Status } from "../../core/enums/Status";

/**
 * Job que elimina bills con status 'draft' cada 10 minutos
 * Cron pattern: "star-slash-10 * * * *" = cada 10 minutos
 */
export const cleanDraftBillsJob = () => {
  // Ejecutar cada 10 minutos
  const task = cron.schedule("*/5 * * * *", async () => {
    try {
      console.log(
        "[CleanDraftBillsJob] Iniciando limpieza de bills con status 'draft'...",
      );

      if (!AppDataSource.isInitialized) {
        console.warn(
          "[CleanDraftBillsJob] DataSource no está inicializado, saltando ejecución",
        );
        return;
      }

      const billRepository = AppDataSource.getRepository(Bill);

      // Buscar y eliminar bills con status DRAFT
      const result = await billRepository.delete({ status: Status.DRAFT });

      if (result.affected && result.affected > 0) {
        console.log(
          `[CleanDraftBillsJob] Se eliminaron ${result.affected} bills con status 'draft'`,
        );
      } else {
        console.log(
          "[CleanDraftBillsJob] No se encontraron bills con status 'draft'",
        );
      }
    } catch (error: any) {
      console.error(
        "[CleanDraftBillsJob] X Error al eliminar bills draft:",
        error.message,
      );
    }
  });

  console.log(
    "[CleanDraftBillsJob] Job iniciado - Se ejecutará cada 10 minutos",
  );

  return task;
};

export const runCleanDraftBillsNow = async (): Promise<{
  deleted: number;
}> => {
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error("DataSource no está inicializado");
    }

    const billRepository = AppDataSource.getRepository(Bill);
    const result = await billRepository.delete({ status: Status.DRAFT });

    return { deleted: result.affected || 0 };
  } catch (error: any) {
    console.error("Error al ejecutar limpieza manual:", error.message);
    throw error;
  }
};
