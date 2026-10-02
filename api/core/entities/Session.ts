import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";

export type SessionMethod = "password" | "pin";

/** Sesión emitida en un login. El JWT lleva su id (jti) y se valida contra esta fila. */
@Entity("sessions")
export class Session {
  @PrimaryColumn({ name: "session_id", type: "uuid" })
  sessionId!: string;

  @Index()
  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @Index()
  @Column({ name: "device_id", type: "int", nullable: true })
  deviceId!: number | null;

  @Column({ type: "varchar", length: 10 })
  method!: SessionMethod;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "last_seen_at", type: "timestamptz" })
  lastSeenAt!: Date;
}
