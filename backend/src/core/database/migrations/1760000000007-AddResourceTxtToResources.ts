import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResourceTxtToResources1720000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resources"
      ADD COLUMN "resourceTxt" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resources"
      DROP COLUMN "resourceTxt"
    `);
  }
}