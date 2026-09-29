import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { TranscriptChunk } from "./transcript-chunk.entity";
import { Meeting } from "./meeting.entity";

@Entity({ name: "meeting_participants" })
export class MeetingParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.participants, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "meetingId" })
  meeting: Meeting;

  @Column({ type: "uuid" })
  meetingId: string;

  @Column({ type: "uuid" })
  personId: string;

  @Column({ type: "varchar", nullable: true })
  role: string | null;

  @ManyToMany(() => TranscriptChunk, (chunk) => chunk.participants)
  transcriptChunks: TranscriptChunk[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
