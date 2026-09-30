import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTranscriptChunks1760000000006 implements MigrationInterface {
  name = "UpdateTranscriptChunks1760000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove channel
    await queryRunner.query(`
      ALTER TABLE "transcript_chunks"
      DROP COLUMN "channel"
    `);

    // Add timestamps
    await queryRunner.query(`
      ALTER TABLE "transcript_chunks"
      ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_chunks"
      ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    `);

    // Create many-to-many junction table
    await queryRunner.query(`
      CREATE TABLE "transcript_chunks_participants" (
        "transcriptChunkId" uuid NOT NULL,
        "meetingParticipantId" uuid NOT NULL,

        CONSTRAINT "PK_transcript_chunks_participants"
          PRIMARY KEY ("transcriptChunkId", "meetingParticipantId")
      )
    `);

    // FK -> transcript_chunks
    await queryRunner.query(`
      ALTER TABLE "transcript_chunks_participants"
      ADD CONSTRAINT "FK_tcp_transcript_chunk"
      FOREIGN KEY ("transcriptChunkId")
      REFERENCES "transcript_chunks"("id")
      ON DELETE CASCADE
    `);

    // FK -> meeting_participants
    await queryRunner.query(`
      ALTER TABLE "transcript_chunks_participants"
      ADD CONSTRAINT "FK_tcp_meeting_participant"
      FOREIGN KEY ("meetingParticipantId")
      REFERENCES "meeting_participants"("id")
      ON DELETE CASCADE
    `);

    // Indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_tcp_transcript_chunk"
      ON "transcript_chunks_participants" ("transcriptChunkId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tcp_meeting_participant"
      ON "transcript_chunks_participants" ("meetingParticipantId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_tcp_meeting_participant"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_tcp_transcript_chunk"
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_chunks_participants"
      DROP CONSTRAINT "FK_tcp_meeting_participant"
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_chunks_participants"
      DROP CONSTRAINT "FK_tcp_transcript_chunk"
    `);

    await queryRunner.query(`
      DROP TABLE "transcript_chunks_participants"
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_chunks"
      DROP COLUMN "updatedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_chunks"
      DROP COLUMN "createdAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "transcript_chunks"
      ADD "channel" integer NOT NULL
    `);
  }
}
