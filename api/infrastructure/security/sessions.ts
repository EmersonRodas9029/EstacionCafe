import { EntityManager, FindOptionsWhere, IsNull } from "typeorm";
import { Session } from "../../core/entities/Session";

/** Revoca las sesiones vigentes que cumplan el filtro (logout, baja, cambio de PIN/rol…). */
export const revokeSessions = (manager: EntityManager, where: FindOptionsWhere<Session>) =>
  manager.update(Session, { ...where, revokedAt: IsNull() }, { revokedAt: new Date() });
