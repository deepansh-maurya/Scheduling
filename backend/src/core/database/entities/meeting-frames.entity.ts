import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum MeetingFrameType {
  SCREEN_FRAME = "SCREEN_FRAME",
  UPLOADED_IMAGE = "UPLOADED_IMAGE"
}

@Entity({ name: "meeting_frames" })
export class MeetingFrame {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: MeetingFrameType
  })
  type: MeetingFrameType;

  @Column({ type: "uuid" })
  meetingId: string;

  @Column({ type: "double precision", nullable: true })
  timestamp: number | null;

  @Column({ type: "int", nullable: true })
  sequenceNumber: number | null;

  @Column({ type: "varchar" })
  storageKey: string;

  @Column({ type: "text", nullable: true })
  ocrText: string | null;

  @Column({ type: "text", nullable: true })
  caption: string | null;

  @Column({ type: "int", nullable: true })
  width: number | null;

  @Column({ type: "int", nullable: true })
  height: number | null;

  @Column({ type: "varchar", nullable: true })
  processingVersion: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
