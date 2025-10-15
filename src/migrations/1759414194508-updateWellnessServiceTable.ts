import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWellnessServiceTable1759414194508 implements MigrationInterface {
    name = 'UpdateWellnessServiceTable1759414194508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "profileImageUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "profileImageUrl"`);
    }

}
