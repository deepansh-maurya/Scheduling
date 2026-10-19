import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

export enum ResourceProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

@Entity({ name: "resource_processing_jobs" })
export class ResourceProcessingJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  meeting_id: string;

  @Column({ type: "uuid" })
  file_id: string;

  @Column({ type: "varchar" })
  file_type: string;

  @Column({ type: "varchar" })
  raw_minio_key: string;

  @Column({ type: "varchar", nullable: true })
  text_minio_key: string | null;

  @Column({
    type: "enum",
    enum: ResourceProcessingStatus,
    default: ResourceProcessingStatus.PENDING
  })
  status: ResourceProcessingStatus;

  @Column({ type: "int", default: 0 })
  attempts: number;

  @Column({ type: "text", nullable: true })
  last_error: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
