import * as cron from "node-cron";
import { LessThan } from "typeorm";
import { AppDataSource } from "../db/Connection";
import { Session } from "../../core/entities/Session";

/** Sesiones vencidas o revocadas se conservan una semana (auditoría) y luego se borran. */
export const SESSION_RETENTION_DAYS = 7;

export const runCleanSessionsNow = async (): Promise<{ deleted: number }> => {
  if (!AppDataSource.isInitialized) throw new Error("DataSource no está inicializado");
  const cutoff = new Date(Date.now() - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await AppDataSource.getRepository(Session).delete({ expiresAt: LessThan(cutoff) });
  return { deleted: result.affected || 0 };
};

/** Todos los días a las 4:00. */
export const cleanSessionsJob = () =>
  cron.schedule("0 4 * * *", async () => {
    try {
      const { deleted } = await runCleanSessionsNow();
      if (deleted) console.log(`[cleanSessions] ${deleted} sesiones viejas eliminadas`);
    } catch (error) {
      console.error("[cleanSessions] Error:", error);
    }
  });
