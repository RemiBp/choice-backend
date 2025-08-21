import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventRatingTables1755598996081 implements MigrationInterface {
    name = 'UpdateEventRatingTables1755598996081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "EventRatingCriteria" ("id" SERIAL NOT NULL, "ratingId" integer NOT NULL, "name" character varying NOT NULL, "value" numeric(2,1) NOT NULL, CONSTRAINT "PK_a97b087f5a51b8dcc5d3baa9ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP COLUMN "ratings"`);
        await queryRunner.query(`ALTER TABLE "Events" ADD "leisureId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Events" ADD CONSTRAINT "FK_d2b1b86d5a6c7f25ef1112e32e5" FOREIGN KEY ("leisureId") REFERENCES "Leisure"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EventRatingCriteria" ADD CONSTRAINT "FK_4a0da37f9f24888704847746ef9" FOREIGN KEY ("ratingId") REFERENCES "EventRatings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EventRatingCriteria" DROP CONSTRAINT "FK_4a0da37f9f24888704847746ef9"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP CONSTRAINT "FK_d2b1b86d5a6c7f25ef1112e32e5"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP COLUMN "leisureId"`);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD "ratings" jsonb NOT NULL`);
        await queryRunner.query(`DROP TABLE "EventRatingCriteria"`);
    }

}
