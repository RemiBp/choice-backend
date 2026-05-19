import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1751614227968 implements MigrationInterface {
    name = 'InitailSetup1751614227968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const enumExists = await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname = 'Events_experiencetype_enum'`);
        if (enumExists.length > 0) {
            await queryRunner.query(`ALTER TYPE "public"."Events_experiencetype_enum" RENAME TO "Events_experiencetype_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."Events_experiencetype_enum" AS ENUM('Tour', 'Workshop', 'Concert', 'Game', 'Exhibition')`);
            await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "experienceType" TYPE "public"."Events_experiencetype_enum" USING "experienceType"::"text"::"public"."Events_experiencetype_enum"`);
            await queryRunner.query(`DROP TYPE "public"."Events_experiencetype_enum_old"`);
        } else {
            await queryRunner.query(`CREATE TYPE "public"."Events_experiencetype_enum" AS ENUM('Tour', 'Workshop', 'Concert', 'Game', 'Exhibition')`);
            const colExists = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='Events' AND column_name='experienceType'`);
            if (colExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "Events" ADD COLUMN "experienceType" "public"."Events_experiencetype_enum"`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Events_experiencetype_enum_old" AS ENUM('bounce', 'click', 'complaint', 'delivery', 'open', 'reject', 'renderingFailure', 'send')`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "experienceType" TYPE "public"."Events_experiencetype_enum_old" USING "experienceType"::"text"::"public"."Events_experiencetype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."Events_experiencetype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Events_experiencetype_enum_old" RENAME TO "Events_experiencetype_enum"`);
    }

}
