import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResources1760000000004 implements MigrationInterface {
  name = "CreateResources1760000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."resources_type_enum"
      AS ENUM (
        'TXT'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "resources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "meetingId" uuid,
        "type" "public"."resources_type_enum" NOT NULL,
        "storageKey" character varying NOT NULL,
        "fileName" character varying NOT NULL,
        "mimeType" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_resources_id"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_resources_userId"
      ON "resources" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_resources_meetingId"
      ON "resources" ("meetingId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_resources_meetingId"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_resources_userId"
    `);

    await queryRunner.query(`
      DROP TABLE "resources"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."resources_type_enum"
    `);
  }
}
