import { Status } from "../../core/enums/Status";

export interface SaveBillDTO {
  billId?: number;
  customer: string;
  cashRegister: number;
  tableId?: string;
  status?: Status;
  total: number;
  date: Date;
}

export interface BillItemDTO {
  billId: number;
  customer: string;
  cashRegisterId?: string;
  tableId?: string;
  total: number;
  status: Status;
  date?: Date;
}

export interface UpdateBillDTO {
  billId?: number;
  customer?: string;
  cashRegisterId?: number;
  tableId?: string;
  total?: number;
  status?: Status;
  date?: Date;
}

export interface SaveBillDetailDTO {
  billId: number;
  billDetails: {
    productId: number;
    name: string;
    quantity: number;
    price: number;
    subTotal: number;
  }[];
}

export interface SaveBillDetailRequestDTO {
  billId: number;
  billDetails: {
    productId: number;
    name: string;
    quantity: number;
    price: number;
    subTotal: number;
  }[];
}

export interface BillDetailResponse {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  subTotal: number;
}
