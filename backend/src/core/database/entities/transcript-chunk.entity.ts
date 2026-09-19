import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Meeting } from "./meeting.entity";

@Entity({ name: "transcript_chunks" })
export class TranscriptChunk {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.transcriptChunks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meetingId" })
  meeting: Meeting;

  @Column()
  meetingId: string;

  @Column({ type: "text" })
  content: string;

  @Column("vector", { length: 768 })
  embedding: number[];

  @Column({ type: "float" })
  startTime: number;

  @Column({ type: "float" })
  endTime: number;

  @Column({ type: "int" })
  channel: number;
}