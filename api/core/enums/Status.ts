export enum Status {
  OPEN = "open",
  CLOSED = "closed",
  DRAFT = "draft",
  FINISHED = "finished",
  /** Anulada por un admin: se conserva para auditoría y no cuenta como venta. */
  VOID = "void",
  /** El mesero la cerró: ya no admite productos y espera que el cajero la cobre. */
  PENDING_PAYMENT = "pending_payment",
}

/** Cuentas en curso: ocupan la mesa y su stock vuelve si se anulan. */
export const ACTIVE_STATUSES = [Status.OPEN, Status.DRAFT, Status.PENDING_PAYMENT];

/** Admiten agregar, cambiar o quitar productos. */
export const EDITABLE_STATUSES = [Status.OPEN, Status.DRAFT];
