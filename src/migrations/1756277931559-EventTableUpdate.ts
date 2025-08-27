import { MigrationInterface, QueryRunner } from "typeorm";

export class EventTableUpdate1756277931559 implements MigrationInterface {
    name = 'EventTableUpdate1756277931559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Events" DROP CONSTRAINT "FK_d2b1b86d5a6c7f25ef1112e32e5"`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "leisureId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Events" ADD CONSTRAINT "FK_d2b1b86d5a6c7f25ef1112e32e5" FOREIGN KEY ("leisureId") REFERENCES "Leisure"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Events" DROP CONSTRAINT "FK_d2b1b86d5a6c7f25ef1112e32e5"`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "leisureId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Events" ADD CONSTRAINT "FK_d2b1b86d5a6c7f25ef1112e32e5" FOREIGN KEY ("leisureId") REFERENCES "Leisure"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
