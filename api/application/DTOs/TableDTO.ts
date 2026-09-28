import { TableStatus } from "../../core/entities/Table";

export interface SaveTableDTO {
  tableId: string;
  zone: string;
  status?: TableStatus;
}

export interface UpdateTableDTO {
  tableId?: string;
  zone?: string;
  status?: TableStatus;
}

export interface TableItemDTO {
  tableId: string;
  zone: string;
  status: TableStatus;
  bills?: any[];
}
