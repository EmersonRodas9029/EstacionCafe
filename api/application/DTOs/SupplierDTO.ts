export interface SaveSupplierDTO {
    supplierId?: number;
    name: string;
    phone: string;
    email: string;
    active?: boolean;
}

export interface SupplierItemDTO {
    supplierId: number;
    name: string;
    phone: string;
    email: string;
    active: boolean;
}

export interface UpdateSupplierDTO {
    name?: string;
    phone?: string;
    email?: string;
    active?: boolean;
}