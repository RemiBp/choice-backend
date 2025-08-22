import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProducerServiceTable1755780600916 implements MigrationInterface {
    name = 'UpdateProducerServiceTable1755780600916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_d2e16efd486459d422801105dac"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP COLUMN "producerServiceId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD "producerServiceId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_d2e16efd486459d422801105dac" FOREIGN KEY ("producerServiceId") REFERENCES "ProducerServices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
