import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/** Equipo del local autorizado por un admin para entrar con PIN. */
@Entity("devices")
export class Device {
  @PrimaryGeneratedColumn({ name: "device_id" })
  deviceId!: number;

  @Column({ length: 60 })
  name!: string;

  /** SHA-256 del token que vive en la cookie del dispositivo; nunca se guarda el token. */
  @Column({ name: "token_hash", length: 64, unique: true, select: false })
  tokenHash!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy!: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "last_seen_at", type: "timestamptz", nullable: true })
  lastSeenAt!: Date | null;
}
