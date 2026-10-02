import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { Bill } from "./Bill";

export enum TableStatus {
  DISPONIBLE = "disponible",
  OCUPADA = "ocupada",
  RESERVADA = "reservada",
}

@Entity("tables")
export class Table {
  @PrimaryColumn({ name: "table_id", type: "varchar", length: 10 })
  tableId!: string;

  @Column({ type: "varchar", length: 50 })
  zone!: string;

  @Column({
    type: "simple-enum",
    enum: TableStatus,
    default: TableStatus.DISPONIBLE,
  })
  status!: TableStatus;

  @OneToMany(() => Bill, (bill: Bill) => bill.table)
  bills!: Bill[];
}
