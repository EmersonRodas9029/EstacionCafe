import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Purchase } from "./Purchase";
import { Consumable } from "./Consumable";

const decimal = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

/** Línea de compra: cuánto de un consumible entró y a qué costo. */
@Entity("purchase_details")
export class PurchaseDetail {
  @PrimaryGeneratedColumn("increment", { name: "purchase_detail_id" })
  purchaseDetailId!: number;

  @Column({ name: "purchase_id" })
  purchaseId!: number;

  @Column({ name: "consumable_id" })
  consumableId!: number;

  @Column("float")
  quantity!: number;

  @Column("decimal", {
    name: "unit_cost",
    precision: 12,
    scale: 4,
    transformer: decimal,
  })
  unitCost!: number;

  @Column("decimal", {
    name: "sub_total",
    precision: 10,
    scale: 2,
    transformer: decimal,
  })
  subTotal!: number;

  @ManyToOne(() => Purchase, (purchase) => purchase.details, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "purchase_id" })
  purchase!: Purchase;

  @ManyToOne(() => Consumable)
  @JoinColumn({ name: "consumable_id" })
  consumable!: Consumable;
}
