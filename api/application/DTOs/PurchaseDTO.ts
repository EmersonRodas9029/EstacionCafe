export interface PurchaseDetailInputDTO {
  consumableId: number;
  quantity: number;
  unitCost: number;
}

export interface SavePurchaseDTO {
  date: Date;
  supplierId: number;
  cashRegisterId?: number;
  /** Con detalles el total se calcula y se suma el stock. */
  details?: PurchaseDetailInputDTO[];
  /** Solo para compras sin detalle (gastos sin inventario). */
  total?: number;
}

export interface UpdatePurchaseDTO {
  purchaseId?: number;
  date?: Date;
  cashRegisterId?: number;
  supplierId?: number;
  total?: number;
}
