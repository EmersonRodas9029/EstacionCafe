import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/Role";

@Entity("user_types")
export class UserType {
  @PrimaryGeneratedColumn("increment", { name: "primary_type_id" })
  userTypeId!: number;
  @Column()
  name: string = "";
  @Column()
  permissionLevel: number = 0;
  /** Rol de autorización que reciben los usuarios de este tipo. */
  @Column({ type: "varchar", length: 20, default: Role.MESERO })
  role: Role = Role.MESERO;

  constructor() {}
}
