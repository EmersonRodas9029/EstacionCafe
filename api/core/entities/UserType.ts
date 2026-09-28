import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("user_types")
export class UserType {
  @PrimaryGeneratedColumn("increment", { name: "primary_type_id" })
  userTypeId!: number;
  @Column()
  name: string = "";
  @Column()
  permissionLevel: number = 0;

  constructor() {}
}
