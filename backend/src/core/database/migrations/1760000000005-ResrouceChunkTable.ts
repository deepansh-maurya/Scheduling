import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResourceChunks1760000000005 implements MigrationInterface {
  name = "CreateResourceChunks1760000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "resource_chunks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resourceId" uuid NOT NULL,
        "content" text NOT NULL,
        "embedding" vector(768) NOT NULL,
        "chunkIndex" integer NOT NULL,
        "startOffset" integer,
        "endOffset" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_resource_chunks_id"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "resource_chunks"
      ADD CONSTRAINT "FK_resource_chunks_resource"
      FOREIGN KEY ("resourceId")
      REFERENCES "resources"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_resource_chunks_resourceId"
      ON "resource_chunks" ("resourceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_resource_chunks_resourceId"
    `);

    await queryRunner.query(`
      ALTER TABLE "resource_chunks"
      DROP CONSTRAINT "FK_resource_chunks_resource"
    `);

    await queryRunner.query(`
      DROP TABLE "resource_chunks"
    `);
  }
}
