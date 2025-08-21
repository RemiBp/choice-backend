import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedEventRatings1755523672793 implements MigrationInterface {
    name = 'AddedEventRatings1755523672793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "EventRatings" ("id" SERIAL NOT NULL, "ratings" jsonb NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "eventId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ffb93c7875f97ba27b7838d3614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD CONSTRAINT "FK_d460207d89f0231991f2a54d2cb" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD CONSTRAINT "FK_3f35525fc9936bcecd4adc7616b" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD CONSTRAINT "FK_c7cd43731ec3a6a1e5386e51e5f" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP CONSTRAINT "FK_c7cd43731ec3a6a1e5386e51e5f"`);
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP CONSTRAINT "FK_3f35525fc9936bcecd4adc7616b"`);
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP CONSTRAINT "FK_d460207d89f0231991f2a54d2cb"`);
        await queryRunner.query(`DROP TABLE "EventRatings"`);
    }

}
