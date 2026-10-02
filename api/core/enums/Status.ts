export enum Status {
  OPEN = "open",
  CLOSED = "closed",
  DRAFT = "draft",
  FINISHED = "finished",
  /** Anulada por un admin: se conserva para auditoría y no cuenta como venta. */
  VOID = "void",
}
