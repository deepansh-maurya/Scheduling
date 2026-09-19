import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTranscriptChunks1750000000005 implements MigrationInterface {
  name = "CreateTranscriptChunks1750000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transcript_chunks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "meetingId" uuid NOT NULL,
        "content" text NOT NULL,
        "embedding" vector(768) NOT NULL,
        "startTime" double precision NOT NULL,
        "endTime" double precision NOT NULL,
        "channel" integer NOT NULL,
        CONSTRAINT "PK_transcript_chunks_id"
          PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "transcript_chunks"
    `);
  }
}
