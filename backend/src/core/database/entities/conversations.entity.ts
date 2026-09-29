import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export enum ConversationType {
  GLOBAL = "GLOBAL",
  MEETING = "MEETING"
}

type ConversationMessage = {
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  content: string;
  timestamp: string;
};

@Entity({ name: "conversations" })
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ConversationType
  })
  type: ConversationType;

  @Column({ type: "uuid", nullable: true })
  meetingId: string | null;

  @Column({ type: "jsonb" })
  messages: ConversationMessage[];

  @Column({ type: "text" })
  content: string;

  @Column("vector", { length: 768 })
  embedding: number[];

  @Column({ type: "float", nullable: true })
  startTime: number | null;

  @Column({ type: "float", nullable: true })
  endTime: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
