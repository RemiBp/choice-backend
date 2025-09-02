import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWellnessServiceTable1756820023362 implements MigrationInterface {
    name = 'UpdateWellnessServiceTable1756820023362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EventBookings" ADD "totalPrice" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EventBookings" DROP COLUMN "totalPrice"`);
    }

}
