import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLatLongToUser1754484491448 implements MigrationInterface {
    name = 'AddLatLongToUser1754484491448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "longitude" double precision`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "bio" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "latitude"`);
    }

}
