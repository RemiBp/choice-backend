import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLeisureTable1755763779901 implements MigrationInterface {
    name = 'UpdateLeisureTable1755763779901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_ae55921706b799a9382ad0f252f"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ALTER COLUMN "leisureId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_ae55921706b799a9382ad0f252f" FOREIGN KEY ("leisureId") REFERENCES "Leisure"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_ae55921706b799a9382ad0f252f"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ALTER COLUMN "leisureId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_ae55921706b799a9382ad0f252f" FOREIGN KEY ("leisureId") REFERENCES "Leisure"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
