import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportorBlockTables1761726227639 implements MigrationInterface {
    name = 'AddedReportorBlockTables1761726227639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."Producers_type_enum" RENAME TO "Producers_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Producers_type_enum" AS ENUM('restaurant', 'leisure', 'wellness')`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "type" TYPE "public"."Producers_type_enum" USING "type"::"text"::"public"."Producers_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Producers_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."Producers_status_enum" RENAME TO "Producers_status_enum_old"`);
        await queryRunner.query(`UPDATE "Producers"SET "status" = 'pending'WHERE "status" = 'claimed';`);
        await queryRunner.query(`CREATE TYPE "public"."Producers_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" TYPE "public"."Producers_status_enum" USING "status"::"text"::"public"."Producers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."Producers_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Producers_status_enum_old" AS ENUM('pending', 'approved', 'rejected', 'claimed')`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" TYPE "public"."Producers_status_enum_old" USING "status"::"text"::"public"."Producers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."Producers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Producers_status_enum_old" RENAME TO "Producers_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."Producers_type_enum_old" AS ENUM('restaurant', 'leisure', 'wellness', 'all')`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "type" TYPE "public"."Producers_type_enum_old" USING "type"::"text"::"public"."Producers_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."Producers_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Producers_type_enum_old" RENAME TO "Producers_type_enum"`);
    }

}
