export interface SaveCashRegisterDTO {
    cashRegisterId?: number;
    number: string;
    active?: boolean;
}

export interface CashRegisterItemDTO {
    cashRegisterId: number;
    number: string;
    active: boolean;
}

export interface UpdateCashRegisterDTO {
    number?: string;
    active?: boolean;
}