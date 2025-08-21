import { MigrationInterface, QueryRunner } from "typeorm";

export class ServiceRatingTables1755593057510 implements MigrationInterface {
    name = 'ServiceRatingTables1755593057510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_be76d55343b8537afb4915237f4"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" RENAME COLUMN "serviceTypeId" TO "serviceId"`);
        await queryRunner.query(`CREATE TABLE "Wellness" ("id" SERIAL NOT NULL, "producerId" integer NOT NULL, "careQuality" numeric(2,1) NOT NULL DEFAULT '0', "cleanliness" numeric(2,1) NOT NULL DEFAULT '0', "welcome" numeric(2,1) NOT NULL DEFAULT '0', "valueForMoney" numeric(2,1) NOT NULL DEFAULT '0', "atmosphere" numeric(2,1) NOT NULL DEFAULT '0', "staffExperience" numeric(2,1) NOT NULL DEFAULT '0', "overall" numeric(2,1) NOT NULL DEFAULT '0', "ai_careQuality" numeric(2,1) NOT NULL DEFAULT '0', "ai_cleanliness" numeric(2,1) NOT NULL DEFAULT '0', "ai_welcome" numeric(2,1) NOT NULL DEFAULT '0', "ai_valueForMoney" numeric(2,1) NOT NULL DEFAULT '0', "ai_atmosphere" numeric(2,1) NOT NULL DEFAULT '0', "ai_staffExperience" numeric(2,1) NOT NULL DEFAULT '0', "ai_overall" numeric(2,1) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c6c83b6c320737b4c7411a438c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_Wellness_producerId" ON "Wellness" ("producerId") `);
        await queryRunner.query(`CREATE TYPE "public"."ProducerServices_type_enum" AS ENUM('Tour', 'Workshop', 'Concert', 'Game', 'Exhibition')`);
        await queryRunner.query(`CREATE TABLE "ProducerServices" ("id" SERIAL NOT NULL, "type" "public"."ProducerServices_type_enum" NOT NULL, "wellnessId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c28088a6994bd2379dbbcae2da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ServiceRatingCriteria" ("id" SERIAL NOT NULL, "ratingId" integer NOT NULL, "name" character varying NOT NULL, "value" numeric(2,1) NOT NULL, CONSTRAINT "PK_a68af0a8951f8f1dff988ece36d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Leisure" ("id" SERIAL NOT NULL, "producerId" integer NOT NULL, "stageDirection" numeric(2,1) NOT NULL DEFAULT '0', "actorPerformance" numeric(2,1) NOT NULL DEFAULT '0', "textQuality" numeric(2,1) NOT NULL DEFAULT '0', "scenography" numeric(2,1) NOT NULL DEFAULT '0', "overall" numeric(2,1) NOT NULL DEFAULT '0', "ai_stageDirection" numeric(2,1) NOT NULL DEFAULT '0', "ai_actorPerformance" numeric(2,1) NOT NULL DEFAULT '0', "ai_textQuality" numeric(2,1) NOT NULL DEFAULT '0', "ai_scenography" numeric(2,1) NOT NULL DEFAULT '0', "ai_overall" numeric(2,1) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e77fc284eef14af5fcc94446993" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_Leisure_producerId" ON "Leisure" ("producerId") `);
        await queryRunner.query(`ALTER TABLE "Wellness" ADD CONSTRAINT "FK_e7e70ae8d68476b752247665bba" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "FK_e0de8adac906d3dde81c83424c2" FOREIGN KEY ("wellnessId") REFERENCES "Wellness"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatingCriteria" ADD CONSTRAINT "FK_4cd88028a6e090583458ab1e735" FOREIGN KEY ("ratingId") REFERENCES "ServiceRatings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_986098e603bbe55ef6c75a46043" FOREIGN KEY ("serviceId") REFERENCES "ProducerServices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Leisure" ADD CONSTRAINT "FK_b91a5e676f2ff0800c4eaaed0c2" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Leisure" DROP CONSTRAINT "FK_b91a5e676f2ff0800c4eaaed0c2"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_986098e603bbe55ef6c75a46043"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatingCriteria" DROP CONSTRAINT "FK_4cd88028a6e090583458ab1e735"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "FK_e0de8adac906d3dde81c83424c2"`);
        await queryRunner.query(`ALTER TABLE "Wellness" DROP CONSTRAINT "FK_e7e70ae8d68476b752247665bba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_Leisure_producerId"`);
        await queryRunner.query(`DROP TABLE "Leisure"`);
        await queryRunner.query(`DROP TABLE "ServiceRatingCriteria"`);
        await queryRunner.query(`DROP TABLE "ProducerServices"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerServices_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_Wellness_producerId"`);
        await queryRunner.query(`DROP TABLE "Wellness"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" RENAME COLUMN "serviceId" TO "serviceTypeId"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_be76d55343b8537afb4915237f4" FOREIGN KEY ("serviceTypeId") REFERENCES "ProducerService"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
