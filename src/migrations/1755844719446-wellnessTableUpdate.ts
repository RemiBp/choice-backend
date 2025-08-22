import { MigrationInterface, QueryRunner } from "typeorm";

export class WellnessTableUpdate1755844719446 implements MigrationInterface {
    name = 'WellnessTableUpdate1755844719446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "WellnessServices" ("id" SERIAL NOT NULL, "wellnessId" integer, "serviceTypeId" integer, CONSTRAINT "PK_cd862444c74ce5d207c1eb8afd6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "WellnessServices" ADD CONSTRAINT "FK_65930ea6c5ae4f38d78e61e0f77" FOREIGN KEY ("wellnessId") REFERENCES "Wellness"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "WellnessServices" ADD CONSTRAINT "FK_55510973c0fcb0b3a3955303b9e" FOREIGN KEY ("serviceTypeId") REFERENCES "WellnessServiceTypes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "WellnessServices" DROP CONSTRAINT "FK_55510973c0fcb0b3a3955303b9e"`);
        await queryRunner.query(`ALTER TABLE "WellnessServices" DROP CONSTRAINT "FK_65930ea6c5ae4f38d78e61e0f77"`);
        await queryRunner.query(`DROP TABLE "WellnessServices"`);
    }

}
