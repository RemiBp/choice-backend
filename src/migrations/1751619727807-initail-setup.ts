import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1751619727807 implements MigrationInterface {
    name = 'InitailSetup1751619727807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const enumExists = await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname = 'Events_status_enum'`);
        if (enumExists.length > 0) {
            await queryRunner.query(`ALTER TYPE "public"."Events_status_enum" RENAME TO "Events_status_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."Events_status_enum" AS ENUM('Draft', 'Active', 'Closed')`);
            await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "status" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "status" TYPE "public"."Events_status_enum" USING "status"::"text"::"public"."Events_status_enum"`);
            await queryRunner.query(`DROP TYPE "public"."Events_status_enum_old"`);
        } else {
            await queryRunner.query(`CREATE TYPE "public"."Events_status_enum" AS ENUM('Draft', 'Active', 'Closed')`);
            const colExists = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='Events' AND column_name='status'`);
            if (colExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "Events" ADD COLUMN "status" "public"."Events_status_enum" NOT NULL DEFAULT 'Draft'`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Events_status_enum_old" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED')`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "status" TYPE "public"."Events_status_enum_old" USING "status"::"text"::"public"."Events_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."Events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Events_status_enum_old" RENAME TO "Events_status_enum"`);
    }

}
