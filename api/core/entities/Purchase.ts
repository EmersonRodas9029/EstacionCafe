import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Supplier } from "./Supplier";

@Entity("purchases")
export class Purchase {
    @PrimaryGeneratedColumn("increment", { name: "purchase_id" })
    purchaseId?: number = undefined;

    @Column()
    date: Date = new Date();

    @Column({ name: "cash_register" })
    cashRegister: number = 0;

    @Column({ name: "supplier_id" })
    supplierId: number = 0;

    @ManyToOne(() => Supplier)
    @JoinColumn({ name: "supplier_id" })
    supplier!: Supplier;

    @Column("decimal", { precision: 10, scale: 2 })
    total: number = 0;
}