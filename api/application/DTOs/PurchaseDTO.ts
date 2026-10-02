export interface SavePurchaseDTO {
    purchaseId?: number;
    date: Date;
    cashRegister: number;
    supplierId: number;
    total: number;
}

export interface PurchaseItemDTO {
    purchaseId: number;
    date: Date;
    cashRegister: number;
    supplierId: number;
    supplierName?: string;
    total: number;
}

export interface UpdatePurchaseDTO {
    date?: Date;
    cashRegister?: number;
    supplierId?: number;
    total?: number;
}