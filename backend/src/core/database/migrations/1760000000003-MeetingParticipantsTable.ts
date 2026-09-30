import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMeetingParticipants1760000000003 implements MigrationInterface {
  name = "CreateMeetingParticipants1760000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "meeting_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "meetingId" uuid NOT NULL,
        "personId" uuid NOT NULL,
        "role" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_meeting_participants_id"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_participants"
      ADD CONSTRAINT "FK_meeting_participants_meeting"
      FOREIGN KEY ("meetingId")
      REFERENCES "meetings"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "meeting_participants_transcript_chunks" (
        "meetingParticipantId" uuid NOT NULL,
        "transcriptChunkId" uuid NOT NULL,

        CONSTRAINT "PK_meeting_participants_transcript_chunks"
          PRIMARY KEY ("meetingParticipantId", "transcriptChunkId")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_participants_transcript_chunks"
      ADD CONSTRAINT "FK_mptc_participant"
      FOREIGN KEY ("meetingParticipantId")
      REFERENCES "meeting_participants"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_participants_transcript_chunks"
      ADD CONSTRAINT "FK_mptc_transcript_chunk"
      FOREIGN KEY ("transcriptChunkId")
      REFERENCES "transcript_chunks"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mptc_participant"
      ON "meeting_participants_transcript_chunks" ("meetingParticipantId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mptc_transcript_chunk"
      ON "meeting_participants_transcript_chunks" ("transcriptChunkId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_mptc_transcript_chunk"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_mptc_participant"
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_participants_transcript_chunks"
      DROP CONSTRAINT "FK_mptc_transcript_chunk"
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_participants_transcript_chunks"
      DROP CONSTRAINT "FK_mptc_participant"
    `);

    await queryRunner.query(`
      DROP TABLE "meeting_participants_transcript_chunks"
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_participants"
      DROP CONSTRAINT "FK_meeting_participants_meeting"
    `);

    await queryRunner.query(`
      DROP TABLE "meeting_participants"
    `);
  }
}
