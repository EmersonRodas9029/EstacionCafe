import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./Producto";
import { Consumable } from "./Consumable";

@Entity("ingredients")
export class Ingredient {
  @PrimaryGeneratedColumn("increment", { name: "ingredient_id" })
  ingredientId!: number;

  @Column({ name: "consumable_id" })
  consumableId!: number;

  @Column()
  name: string = "";

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number = 0;

  @Column({ name: "product_id" })
  productId!: number;

  @ManyToOne(() => Consumable, (consumable) => consumable.ingredients)
  @JoinColumn({ name: "consumable_id" })
  consumable!: Consumable;

  @ManyToOne(() => Product, (product) => product.ingredients)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  constructor() {}
}
