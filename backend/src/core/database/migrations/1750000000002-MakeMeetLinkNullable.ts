import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeMeetLinkNullable1750000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "meetLink" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This will fail if there are NULL values.
    // Replace NULL values before making the column NOT NULL again.
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "meetLink" SET NOT NULL
    `);
  }
}