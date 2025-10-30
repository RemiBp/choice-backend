import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProducerOfferStatusEnum1760618868419 implements MigrationInterface {
    name = 'UpdateProducerOfferStatusEnum1760618868419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."ProducerOffer_status_enum" RENAME TO "ProducerOffer_status_enum_old";`);
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'SENT', 'EXPIRED');`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ALTER COLUMN "status" DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ALTER COLUMN "status" TYPE "public"."ProducerOffer_status_enum" USING "status"::text::"public"."ProducerOffer_status_enum";`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ALTER COLUMN "status" SET DEFAULT 'DRAFT';`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_status_enum_old";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_status_enum_old" AS ENUM('DRAFT', 'ACTIVE', 'EXPIRED');`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ALTER COLUMN "status" DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ALTER COLUMN "status" TYPE "public"."ProducerOffer_status_enum_old" USING "status"::text::"public"."ProducerOffer_status_enum_old";`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ALTER COLUMN "status" SET DEFAULT 'DRAFT';`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_status_enum";`);
        await queryRunner.query(`ALTER TYPE "public"."ProducerOffer_status_enum_old" RENAME TO "ProducerOffer_status_enum";`);
    }
}
