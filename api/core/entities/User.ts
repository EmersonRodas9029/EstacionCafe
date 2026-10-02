import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserType } from "./UserType";
import { Bill } from "./Bill";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("increment", { name: "user_id" })
  userId!: number;

  @Column({ unique: true })
  username: string = "";

  @Column({ name: "type_id" })
  userTypeId: number = 1;

  // Nunca se devuelve en consultas normales; usar addSelect explícito
  @Column({ select: false })
  password!: string;

  @Column()
  email: string = "";

  @Column()
  active: boolean = true;

  @ManyToOne(() => UserType, (type) => type.userTypeId)
  @JoinColumn({ name: "type_id" })
  userType?: UserType;

  @OneToMany(() => Bill, (bill: Bill) => bill.waiter)
  bills!: Bill[];

  constructor() {}
}
