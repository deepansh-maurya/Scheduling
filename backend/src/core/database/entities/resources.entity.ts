import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export enum ResourceType {
  TXT = "TXT"
}

@Entity({ name: "resources" })
export class Resource {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid", nullable: true })
  meetingId: string | null;

  @Column({
    type: "enum",
    enum: ResourceType
  })
  type: ResourceType;

  @Column({ type: "varchar" })
  storageKey: string;

  @Column({ type: "varchar" })
  fileName: string;

  @Column({ type: "varchar", nullable: true })
  mimeType: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
