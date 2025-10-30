import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWellnessServiceTable1759223723151 implements MigrationInterface {
    name = 'UpdateWellnessServiceTable1759223723151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_timeofday_enum" AS ENUM('ALL_DAY', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT')`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ADD "timeOfDay" "public"."ProducerOffer_timeofday_enum" NOT NULL DEFAULT 'ALL_DAY'`);
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_daysofweek_enum" AS ENUM('EVERYDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ADD "daysOfWeek" "public"."ProducerOffer_daysofweek_enum" array NOT NULL DEFAULT '{EVERYDAY}'`);
        await queryRunner.query(`ALTER TABLE "Producers" ADD "companyEmail" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Producers" DROP COLUMN "companyEmail"`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" DROP COLUMN "daysOfWeek"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_daysofweek_enum"`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" DROP COLUMN "timeOfDay"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_timeofday_enum"`);
    }

}
