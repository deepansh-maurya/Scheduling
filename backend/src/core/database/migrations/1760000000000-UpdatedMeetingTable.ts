import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGistsToMeetings1760000000000 implements MigrationInterface {
  name = "AddGistsToMeetings1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ADD "meetingGist" text
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ADD "chatbotGist" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      DROP COLUMN "chatbotGist"
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      DROP COLUMN "meetingGist"
    `);
  }
}
