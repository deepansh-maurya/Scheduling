import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeMeetingFieldsNullable1750000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "guestName" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "guestEmail" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "additionalInfo" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "eventId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "guestName" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "guestEmail" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "additionalInfo" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "eventId" SET NOT NULL
    `);
  }
}
