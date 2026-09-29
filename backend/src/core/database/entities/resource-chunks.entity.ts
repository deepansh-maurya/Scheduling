import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Resource } from "./resources.entity";

@Entity({ name: "resource_chunks" })
export class ResourceChunk {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Resource, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "resourceId" })
  resource: Resource;

  @Column({ type: "uuid" })
  resourceId: string;

  @Column({ type: "text" })
  content: string;

  @Column("vector", { length: 768 })
  embedding: number[];

  @Column({ type: "int" })
  chunkIndex: number;

  @Column({ type: "int", nullable: true })
  startOffset: number | null;

  @Column({ type: "int", nullable: true })
  endOffset: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
