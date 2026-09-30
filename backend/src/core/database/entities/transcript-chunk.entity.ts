import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Meeting } from "./meeting.entity";
import { MeetingParticipant } from "./meeting-participants.entity";

@Entity({ name: "transcript_chunks" })
export class TranscriptChunk {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.transcriptChunks, {
    onDelete: "CASCADE"
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

  @ManyToMany(() => MeetingParticipant)
  @JoinTable()
  participants: MeetingParticipant[];

  @Column({ type: "float" })
  endTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // channel removed
}
