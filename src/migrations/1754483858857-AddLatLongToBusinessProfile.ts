import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLatLongToBusinessProfile1754483858857 implements MigrationInterface {
    name = 'AddLatLongToBusinessProfile1754483858857'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "BusinessProfiles" ADD "latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "BusinessProfiles" ADD "longitude" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "BusinessProfiles" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "BusinessProfiles" DROP COLUMN "latitude"`);
    }

}
