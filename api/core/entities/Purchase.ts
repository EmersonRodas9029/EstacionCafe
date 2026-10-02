import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Supplier } from "./Supplier";
import { CashRegister } from "./CashRegister";
import { PurchaseDetail } from "./PurchaseDetail";

@Entity("purchases")
export class Purchase {
  @PrimaryGeneratedColumn("increment", { name: "purchase_id" })
  purchaseId?: number = undefined;

  @Column({ type: "timestamptz" })
  date: Date = new Date();

  /** Caja de la que salió el dinero (opcional). */
  @Column({ name: "cash_register_id", type: "int", nullable: true })
  cashRegisterId?: number | null;

  @ManyToOne(() => CashRegister, { nullable: true })
  @JoinColumn({ name: "cash_register_id" })
  cashRegister?: CashRegister | null;

  @Column({ name: "supplier_id" })
  supplierId: number = 0;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "supplier_id" })
  supplier!: Supplier;

  @Column("decimal", {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  total: number = 0;

  @OneToMany(() => PurchaseDetail, (detail) => detail.purchase)
  details!: PurchaseDetail[];
}
