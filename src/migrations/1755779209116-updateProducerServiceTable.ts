import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProducerServiceTable1755779209116 implements MigrationInterface {
    name = 'UpdateProducerServiceTable1755779209116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ProducerServices" RENAME COLUMN "type" TO "serviceTypeId"`);
        await queryRunner.query(`ALTER TYPE "public"."ProducerServices_type_enum" RENAME TO "ProducerServices_servicetypeid_enum"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "serviceTypeId"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "serviceTypeId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_d2e16efd486459d422801105dac"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ALTER COLUMN "producerServiceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "FK_ee4b898a21e67d5d1ef884564c1" FOREIGN KEY ("serviceTypeId") REFERENCES "WellnessServiceTypes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_d2e16efd486459d422801105dac" FOREIGN KEY ("producerServiceId") REFERENCES "ProducerServices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_d2e16efd486459d422801105dac"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "FK_ee4b898a21e67d5d1ef884564c1"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ALTER COLUMN "producerServiceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_d2e16efd486459d422801105dac" FOREIGN KEY ("producerServiceId") REFERENCES "ProducerServices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "serviceTypeId"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "serviceTypeId" "public"."ProducerServices_servicetypeid_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."ProducerServices_servicetypeid_enum" RENAME TO "ProducerServices_type_enum"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" RENAME COLUMN "serviceTypeId" TO "type"`);
    }

}
