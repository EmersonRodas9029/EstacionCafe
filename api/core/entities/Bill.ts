import { PaymentMethod } from "../enums/PaymentMethod";
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
import { CashRegister } from "./CashRegister";
import { Status } from "../enums/Status";
import { OrderType } from "../enums/OrderType";

@Entity("bills")
export class Bill {
  @PrimaryGeneratedColumn("increment", { name: "bill_id" })
  billId?: number = undefined;

  /** Usuario (mesero/cajero) que abrió la cuenta; se toma del token. */
  @Column({ name: "waiter_id" })
  waiterId!: number;

  /** Caja donde se cobró; se asigna al cerrar la cuenta. */
  @Column({ name: "cash_register_id", type: "int", nullable: true })
  cashRegisterId?: number | null;

  @Column({ name: "table_id", type: "varchar", length: 10, nullable: true })
  tableId?: string | null;

  @Column({
    name: "order_type",
    type: "varchar",
    length: 20,
    default: OrderType.DINE_IN,
  })
  orderType: OrderType = OrderType.DINE_IN;

  @Column()
  customer: string = "";
  @Column({ type: "timestamptz" })
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
  total: number = 0;

  @Column({ type: "varchar", length: 20, default: Status.DRAFT })
  status!: Status;

  /** Cómo se cobró (efectivo o tarjeta); null mientras no esté cobrada. */
  @Column({ name: "payment_method", type: "varchar", length: 10, nullable: true })
  paymentMethod?: PaymentMethod | null;

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

  @JoinColumn({ name: "waiter_id" })
  @ManyToOne(() => User, (user: User) => user.bills)
  waiter!: User;

  @JoinColumn({ name: "cash_register_id" })
  @ManyToOne(() => CashRegister, (register) => register.bills, {
    nullable: true,
  })
  cashRegister?: CashRegister | null;

  @JoinColumn({ name: "table_id" })
  @ManyToOne(() => Table, (table: Table) => table.bills, { nullable: true })
  table?: Table | null;
}
