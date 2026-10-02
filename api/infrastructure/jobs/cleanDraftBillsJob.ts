import * as cron from "node-cron";
import { AppDataSource } from "../db/Connection";
import { Bill } from "../../core/entities/Bill";
import { Status } from "../../core/enums/Status";

/** Un draft sin productos más viejo que esto se considera abandonado. */
export const DRAFT_TTL_HOURS = 2;

/**
 * Elimina órdenes en borrador abandonadas: status draft, sin detalles y
 * creadas hace más de DRAFT_TTL_HOURS. Los drafts con productos se conservan
 * porque ya descontaron stock y siguen en edición.
 */
export const runCleanDraftBillsNow = async (): Promise<{
  deleted: number;
}> => {
  if (!AppDataSource.isInitialized) {
    throw new Error("DataSource no está inicializado");
  }

  const cutoff = new Date(Date.now() - DRAFT_TTL_HOURS * 60 * 60 * 1000);

  const result = await AppDataSource.getRepository(Bill)
    .createQueryBuilder()
    .delete()
    .from(Bill)
    .where("status = :status", { status: Status.DRAFT })
    .andWhere("created_at < :cutoff", { cutoff })
    .andWhere(
      "NOT EXISTS (SELECT 1 FROM bill_details d WHERE d.bill_id = bills.bill_id)",
    )
    .execute();

  return { deleted: result.affected || 0 };
};

/** Cada 10 minutos. */
export const cleanDraftBillsJob = () => {
  const task = cron.schedule("*/10 * * * *", async () => {
    try {
      if (!AppDataSource.isInitialized) {
        console.warn("[CleanDraftBillsJob] DataSource no inicializado, se omite");
        return;
      }
      const { deleted } = await runCleanDraftBillsNow();
      if (deleted > 0) {
        console.log(`[CleanDraftBillsJob] ${deleted} drafts abandonados eliminados`);
      }
    } catch (error: any) {
      console.error("[CleanDraftBillsJob] Error al limpiar drafts:", error.message);
    }
  });

  console.log("[CleanDraftBillsJob] Job iniciado - cada 10 minutos");
  return task;
};
