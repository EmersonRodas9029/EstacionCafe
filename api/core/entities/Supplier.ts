import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Consumable } from "./Consumable";

@Entity("suppliers")
export class Supplier {
    @PrimaryGeneratedColumn("increment", { name: "supplier_id" })
    supplierId!: number;

    @Column({ length: 100 })
    name: string = "";

    @Column({ length: 20 })
    phone: string = "";

    @Column({ length: 100 })
    email: string = "";

    @Column({ default: true })
    active: boolean = true;

    @OneToMany(()=> Consumable, (consumable:Consumable)=> consumable.supplier)
    consumable!:Consumable;
}