import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Bill } from "./Bill";

@Entity("cash_registers")
export class CashRegister {
  @PrimaryGeneratedColumn("increment", { name: "cash_register_id" })
  cashRegisterId!: number;

  @Column({ type: "varchar", length: 20, unique: true })
  number!: string;

  @Column({ default: true })
  active: boolean = true;

  @OneToMany(() => Bill, (bill: Bill) => bill.cashRegister)
  bills!: Bill[];
}
