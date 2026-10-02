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

  @Column()
  password: string = "";

  @Column()
  email: string = "";

  @Column()
  active: boolean = true;

  @ManyToOne(() => UserType, (type) => type.userTypeId)
  @JoinColumn({ name: "type_id" })
  userType?: UserType;

  @OneToMany(() => Bill, (bill: Bill) => bill.cashRegister)
  bill!: Bill;

  constructor() {}
}
