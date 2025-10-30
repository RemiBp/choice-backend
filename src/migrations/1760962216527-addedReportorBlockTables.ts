import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAllToProducersEnum1760962216527 implements MigrationInterface {
    name = 'AddAllToProducersEnum1760962216527';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "public"."Producers_type_enum" ADD VALUE IF NOT EXISTS 'all';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Producers_type_enum') THEN
                    CREATE TYPE "public"."Producers_type_enum_old" AS ENUM ('restaurant', 'leisure', 'wellness');
                    ALTER TABLE "Producer" ALTER COLUMN "type" DROP DEFAULT;
                    ALTER TABLE "Producer" ALTER COLUMN "type" TYPE "public"."Producers_type_enum_old" 
                        USING "type"::text::"public"."Producers_type_enum_old";
                    DROP TYPE "public"."Producers_type_enum";
                    ALTER TYPE "public"."Producers_type_enum_old" RENAME TO "Producers_type_enum";
                END IF;
            END$$;
        `);
    }
}
