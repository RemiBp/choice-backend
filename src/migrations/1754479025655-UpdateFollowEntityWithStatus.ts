import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFollowEntityWithStatus1754479025655 implements MigrationInterface {
    name = 'UpdateFollowEntityWithStatus1754479025655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Follows_status_enum" AS ENUM('Pending', 'Approved')`);
        await queryRunner.query(`ALTER TABLE "Follows" ADD "status" "public"."Follows_status_enum" NOT NULL DEFAULT 'Pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Follows" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."Follows_status_enum"`);
    }

}
