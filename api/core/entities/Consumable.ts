import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ConsumableType } from "./ConsumableType";
import { UnitMeasurement } from "../enums/UnitMeasurement";
import { Ingredient } from "./Ingredient";
import { Supplier } from "./Supplier";

@Entity("Consumable")
export class Consumable {
  @PrimaryGeneratedColumn("increment", { name: "consumable_id" })
  consumableId!: number;
  @Column({ name: "supplier_id" })
  supplierId!: number;
  @Column()
  name: string = "";
  @Column({ name: "consumable_type_id" })
  consumableTypeId: number = 0;

  @ManyToOne(() => ConsumableType, (type: ConsumableType) => type)
  @JoinColumn({ name: "consumable_type_id" })
  consumableType?: ConsumableType;
  @Column("float")
  quantity: number = 0;
  @Column({ name: "unitMeasurement", type: "varchar", length: 20 })
  unitMeasurement!: UnitMeasurement;
  // 4 decimales: el costo suele ser por gramo o mililitro (p. ej. $0.0025/ml)
  @Column("numeric", {
    precision: 12,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  cost: number = 0;

  /** Umbral de alerta: stock bajo cuando quantity <= minStock. */
  @Column("float", { name: "min_stock", default: 0 })
  minStock: number = 0;

  @Column({default:true})
  active!:boolean;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.consumable)
  ingredients!: Ingredient[];

  @JoinColumn({ name: "supplier_id" })
  @ManyToOne(() => Supplier, (supplier: Supplier) => supplier.consumable)
  supplier!: Supplier;

  constructor() {}
}
