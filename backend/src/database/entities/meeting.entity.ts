import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "./user.entity";
import { Event } from "./event.entity";
import { IntegrationAppTypeEnum } from "./integration.entity";
import { TranscriptChunk } from "./transcript-chunk.entity";

export enum MeetingStatus {
  SCHEDULED = "SCHEDULED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED"
}

interface MeetingAttendee {
  name?: string;
  email?: string;
  responseStatus?: string;
}

export enum MeetingType {
  EVENT_BOOKING = "EVENT_BOOKING",
  CALENDAR_EVENT = "CALENDAR_EVENT"
}

export  interface TranscriptSegment {
  id: string;
  text: string;
  start: number;
  end: number;
  channel: number;
}

interface MeetingTranscript {
  language: string;
  duration: number;
  channels: number;
  segments: TranscriptSegment[];
}

@Entity({ name: "meetings" })
export class Meeting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.meetings)
  user: User;

  @ManyToOne(() => Event, (event) => event.meetings, { nullable: true })
  event: Event | null;

  @Column({
    type: "enum",
    enum: MeetingType
  })
  meetingType: MeetingType;

  @Column({ type: "varchar", nullable: true })
  guestName: string | null;

  @Column({ type: "varchar", nullable: true })
  guestEmail: string | null;

  @Column({ type: "varchar", nullable: true })
  additionalInfo: string | null;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({
    type: "varchar",
    nullable: true
  })
  meetLink: string | null;

  @Column()
  calendarEventId: string;

  @Column({ type: "enum", enum: IntegrationAppTypeEnum, nullable: true })
  calendarAppType: IntegrationAppTypeEnum | null;

  @Column({ type: "jsonb", nullable: true }) attendees:
    | MeetingAttendee[]
    | null;

  @Column({
    type: "varchar",
    nullable: true
  })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({
    type: "enum",
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED
  })
  status: MeetingStatus;

  @Column({ type: "jsonb", nullable: true })
  transcript: MeetingTranscript | null;

  @OneToMany(
    () => TranscriptChunk,
    (transcriptChunk) => transcriptChunk.meetingId
  )
  transcriptChunks: TranscriptChunk[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
