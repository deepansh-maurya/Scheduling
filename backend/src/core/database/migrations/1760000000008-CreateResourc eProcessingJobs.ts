import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResourceProcessingJobs1760800000000 implements MigrationInterface {
  name = "CreateResourceProcessingJobs1760800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "resource_processing_jobs_status_enum"
      AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE "resource_processing_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "meeting_id" uuid NOT NULL,
        "file_id" uuid NOT NULL,
        "file_type" varchar NOT NULL,
        "raw_minio_key" varchar NOT NULL,
        "text_minio_key" varchar,
        "is_bm25_ready" boolean NOT NULL DEFAULT false,
        "status" "resource_processing_jobs_status_enum"
          NOT NULL DEFAULT 'PENDING',
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resource_processing_jobs"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_resource_processing_jobs_status"
      ON "resource_processing_jobs" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_resource_processing_jobs_file_id"
      ON "resource_processing_jobs" ("file_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_resource_processing_jobs_file_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_resource_processing_jobs_status"
    `);

    await queryRunner.query(`
      DROP TABLE "resource_processing_jobs"
    `);

    await queryRunner.query(`
      DROP TYPE "resource_processing_jobs_status_enum"
    `);
  }
}
