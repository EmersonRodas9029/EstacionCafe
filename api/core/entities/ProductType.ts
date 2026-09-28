import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./Producto";

@Entity("product_types")
export class ProductType {
  @PrimaryGeneratedColumn("increment", { name: "product_type_id" })
  productTypeId!: number;

  @Column()
  name: string = "";

  @OneToMany(() => Product, (product: Product) => product.productType)
  products!: Product[];

  constructor() {}
}
