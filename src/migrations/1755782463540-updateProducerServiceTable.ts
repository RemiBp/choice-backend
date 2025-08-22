import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProducerServiceTable1755782463540 implements MigrationInterface {
    name = 'UpdateProducerServiceTable1755782463540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_be76d55343b8537afb4915237f4"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "FK_ee4b898a21e67d5d1ef884564c1"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" RENAME COLUMN "serviceTypeId" TO "producerServiceId"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "duration" character varying`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "price" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "maxCapacity" integer`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "serviceImages" text array`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "slug" character varying`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "UQ_537eb13291a3df1584a0f24d4fc" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "producerId" integer`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ALTER COLUMN "serviceTypeId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_d2e16efd486459d422801105dac" FOREIGN KEY ("producerServiceId") REFERENCES "ProducerServices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "FK_ee4b898a21e67d5d1ef884564c1" FOREIGN KEY ("serviceTypeId") REFERENCES "WellnessServiceTypes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "FK_c44264c0cf6b3d4e021edf65bf0" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "FK_c44264c0cf6b3d4e021edf65bf0"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "FK_ee4b898a21e67d5d1ef884564c1"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_d2e16efd486459d422801105dac"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ALTER COLUMN "serviceTypeId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "producerId"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "isDeleted"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "UQ_537eb13291a3df1584a0f24d4fc"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "serviceImages"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "maxCapacity"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" RENAME COLUMN "producerServiceId" TO "serviceTypeId"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "FK_ee4b898a21e67d5d1ef884564c1" FOREIGN KEY ("serviceTypeId") REFERENCES "WellnessServiceTypes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_be76d55343b8537afb4915237f4" FOREIGN KEY ("serviceTypeId") REFERENCES "WellnessServiceTypes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
