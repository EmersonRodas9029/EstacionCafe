import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { BillDetails } from "./BillDetails";
import { User } from "./User";
import { Table } from "./Table";
import { Status } from "../enums/Status";

@Entity("bills")
export class Bill {
  @PrimaryGeneratedColumn("increment", { name: "bill_id" })
  billId?: number = undefined;

  @Column({ name: "cash_register" })
  cashRegisterId!: number;

  @Column({ name: "table_id", type: "varchar", length: 10, nullable: true })
  tableId?: string;

  @Column()
  customer: string = "";
  @Column()
  date: Date = new Date();

  @Column("decimal", {
    name: "total",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  total!: number;

  @Column({ type: "varchar", length: 20, default: Status.DRAFT })
  status!: Status;

  @CreateDateColumn({
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @OneToMany(() => BillDetails, (billDet: BillDetails) => billDet.bill)
  billDetails!: BillDetails[];

  @JoinColumn({ name: "cash_register" })
  @ManyToOne(() => User, (cashRegister: User) => cashRegister.bill)
  cashRegister!: User;

  @JoinColumn({ name: "table_id" })
  @ManyToOne(() => Table, (table: Table) => table.bills, { nullable: true })
  table?: Table;
}
