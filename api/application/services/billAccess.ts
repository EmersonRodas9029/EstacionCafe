import { Role } from "../../core/enums/Role";
import { AppError } from "../errors/AppError";

/** Quién hace la petición (req.user). Sin actor = uso interno con acceso total. */
export interface Actor {
  userId: number;
  role: Role | string;
}

/**
 * Regla única de privacidad: el mesero solo ve y opera sus cuentas; el cajero
 * y el admin, todas. Devuelve el waiterId a filtrar o undefined si no aplica.
 */
export const ownerScope = (actor?: Actor) =>
  actor?.role === Role.MESERO ? actor.userId : undefined;

/** Una cuenta ajena responde 404 para no revelar que existe. */
export const assertBillAccess = (bill: { billId?: number; waiterId: number }, actor?: Actor) => {
  const scope = ownerScope(actor);
  if (scope !== undefined && bill.waiterId !== scope) {
    throw AppError.notFound(`Factura con ID ${bill.billId} no encontrada`);
  }
};
