import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTranscriptToMeeting1750000000004 implements MigrationInterface {
  name = "AddTranscriptToMeeting1750000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ADD "transcript" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      DROP COLUMN "transcript"
    `);
  }
}
