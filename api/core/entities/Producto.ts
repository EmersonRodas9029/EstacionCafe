import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BillDetails } from "./BillDetails";
import { Ingredient } from "./Ingredient";
import { ProductType } from "./ProductType";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn({ name: "product_id" })
  productId!: number;

  @Column()
  name: string = "";
  @Column()
  description: string = "";
  @Column("decimal", {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number = 0.0;
  @Column("decimal", {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  cost: number = 0.0;
  @Column()
  active: boolean = true;

  @Column({ name: "product_type_id", nullable: true })
  productTypeId: number = 0;

  @ManyToOne(
    () => ProductType,
    (productType: ProductType) => productType.products,
  )
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @OneToMany(() => BillDetails, (billDetail: BillDetails) => billDetail.product)
  billDetails!: BillDetails[];
  @OneToMany(() => Ingredient, (ingredient) => ingredient.product)
  ingredients!: Ingredient[];
  constructor() {}
}
