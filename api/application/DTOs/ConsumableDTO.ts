import { UnitMeasurement } from "../../core/enums/UnitMeasurement";

export interface SaveConsumableDTO {
  supplierId: number;
  name: string;
  cosumableTypeId: number;
  quantity: number;
  unitMeasurement: UnitMeasurement;
  cost: number;
}

export interface ConsumableItemDTO {
  consumableId: number;
  name: string;
  supplierId: number;
  cosumableTypeId: number;
  quantity: number;
  unitMeasurement: UnitMeasurement;
  cost: number;
  supplier?: {
    supplierId: number;
    name: string;
    email: string;
    phone: string;
  };
  consumableType?: {
    consumableTypeId: number;
    name: string;
  };
  active:boolean;
}

export interface UpdateConsumableDTO {
  consumableId?: number;
  supplier?: number;
  name?: string;
  TypeId?: number;
  quantity?: number;
  unitMeasurement?: UnitMeasurement;
  cost?: number;
}

export interface SaveConsumableTypeDTO {
  name: string;
}

export interface ConsumableTypeItemDTO {
  consumableTypeId: number;
  name: string;
}

export interface UpdateConsumableTypeDTO {
  consumableTypeId?: number;
  name?: string;
}

export interface ConsumableStockAlertDTO {
  consumableId: number;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  unitMeasurement: UnitMeasurement;
  supplier: {
    supplierId: number;
    name: string;
    phone: string;
    email: string;
  };
  lastPurchaseDate?: Date;
  averageConsumption?: number;
}

export interface ConsumableUsageDTO {
  consumableId: number;
  name: string;
  usedQuantity: number;
  remainingQuantity: number;
  unitMeasurement: UnitMeasurement;
  usageDate: Date;
  productName?: string;
}
