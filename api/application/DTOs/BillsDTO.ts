import { PaymentMethod } from "../../core/enums/PaymentMethod";
import { Status } from "../../core/enums/Status";
import { OrderType } from "../../core/enums/OrderType";

export interface SaveBillDTO {
  customer: string;
  tableId?: string;
  orderType: OrderType;
  status?: Status;
  cashRegisterId?: number;
  date?: Date;
}

export interface UpdateBillDTO {
  billId?: number;
  customer?: string;
  cashRegisterId?: number;
  tableId?: string;
  total?: number;
  status?: Status;
  paymentMethod?: PaymentMethod;
  date?: Date;
}

export interface BillFiltersDTO {
  status?: Status;
  orderType?: OrderType;
  tableId?: string;
  waiterId?: number;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface SaveBillDetailDTO {
  billId: number;
  billDetails: {
    productId: number;
    quantity: number;
  }[];
}

export interface BillDetailResponse {
  billDetailId: number;
  productId: number;
  name: string;
  quantity: number;
  price: number;
  subTotal: number;
}
