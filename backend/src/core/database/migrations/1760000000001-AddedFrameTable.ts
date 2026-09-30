import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMeetingFrames1760000000001 implements MigrationInterface {
  name = "CreateMeetingFrames1760000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."meeting_frames_type_enum"
      AS ENUM (
        'SCREEN_FRAME',
        'UPLOADED_IMAGE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "meeting_frames" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."meeting_frames_type_enum" NOT NULL,
        "meetingId" uuid NOT NULL,
        "timestamp" double precision,
        "sequenceNumber" integer,
        "storageKey" character varying NOT NULL,
        "ocrText" text,
        "caption" text,
        "width" integer,
        "height" integer,
        "processingVersion" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_meeting_frames_id"
          PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "meeting_frames"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."meeting_frames_type_enum"
    `);
  }
}
