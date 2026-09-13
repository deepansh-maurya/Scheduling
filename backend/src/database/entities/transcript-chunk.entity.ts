import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "transcript_chunks" })
export class TranscriptChunk {
  @PrimaryGeneratedColumn("uuid")
  id: string;

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
