import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCalendarFieldsToMeetings1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add genuinely new columns
    await queryRunner.addColumns("meetings", [
      new TableColumn({
        name: "title",
        type: "varchar",
        isNullable: true
      }),

      new TableColumn({
        name: "description",
        type: "text",
        isNullable: true
      }),

      new TableColumn({
        name: "attendees",
        type: "jsonb",
        isNullable: true
      })
    ]);

    // Create enum type
    await queryRunner.query(`
      CREATE TYPE "meetings_calendarapptype_enum"
      AS ENUM ('GOOGLE_MEET_AND_CALENDAR')
    `);

    // Update existing calendarAppType column
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "calendarAppType"
      TYPE "meetings_calendarapptype_enum"
      USING "calendarAppType"::"meetings_calendarapptype_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Change enum back to varchar
    await queryRunner.query(`
      ALTER TABLE "meetings"
      ALTER COLUMN "calendarAppType"
      TYPE varchar
      USING "calendarAppType"::varchar
    `);

    await queryRunner.query(`
      DROP TYPE "meetings_calendarapptype_enum"
    `);

    await queryRunner.dropColumn("meetings", "attendees");
    await queryRunner.dropColumn("meetings", "description");
    await queryRunner.dropColumn("meetings", "title");
  }
}
