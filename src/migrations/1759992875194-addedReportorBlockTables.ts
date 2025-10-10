import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportorBlockTables1759992875194 implements MigrationInterface {
    name = 'AddedReportorBlockTables1759992875194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Events" ADD "rating" jsonb`);
        await queryRunner.query(`ALTER TABLE "MenuDishes" ADD "rating" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "MenuDishes" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP COLUMN "rating"`);
    }

}
