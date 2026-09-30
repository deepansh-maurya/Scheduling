import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConversations1760000000002 implements MigrationInterface {
  name = "CreateConversations1760000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."conversations_type_enum"
      AS ENUM (
        'GLOBAL',
        'MEETING'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),

        "type" "public"."conversations_type_enum" NOT NULL,

        "meetingId" uuid,

        "messages" jsonb NOT NULL,

        "content" text NOT NULL,

        "embedding" vector(768) NOT NULL,

        "startTime" double precision,

        "endTime" double precision,

        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),

        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_conversations_id"
          PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "conversations"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."conversations_type_enum"
    `);
  }
}
