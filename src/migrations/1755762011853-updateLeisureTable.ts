import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateLeisureTable1755762011853 implements MigrationInterface {
    name = 'UpdateLeisureTable1755762011853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_fb49af21c4296d14a50e584dbd5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LeisurePostRating_user_post_event"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP COLUMN "eventId"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LeisurePostRating_user_post" ON "LeisurePostRatings" ("userId", "postId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_LeisurePostRating_user_post"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD "eventId" integer NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LeisurePostRating_user_post_event" ON "LeisurePostRatings" ("eventId", "postId", "userId") `);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_fb49af21c4296d14a50e584dbd5" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
