import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1750747225625 implements MigrationInterface {
    name = 'InitailSetup1750747225625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "profilePicture"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "about"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "fullName" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "userName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "userName"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "about" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "profilePicture" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "lastName" character varying`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "firstName" character varying`);
    }

}
