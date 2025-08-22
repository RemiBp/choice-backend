import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostTagTable1755694050756 implements MigrationInterface {
    name = 'UpdatePostTagTable1755694050756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_986098e603bbe55ef6c75a46043"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LeisurePostRating_user_post"`);
        await queryRunner.query(`CREATE TABLE "WellnessServiceTypes" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "criteria" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0d1ece4501a43351ffaae1e5e63" UNIQUE ("name"), CONSTRAINT "PK_e53771d7cc6d0ed31644c9d8030" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ProducerServices" ("id" SERIAL NOT NULL, "type" "public"."ProducerServices_type_enum" NOT NULL, "wellnessId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c28088a6994bd2379dbbcae2da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "EventTypes" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "criteria" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1654e41c2826e29c8212e3a69b7" UNIQUE ("name"), CONSTRAINT "PK_38b71b4ebec11ded06d4a2020a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP COLUMN "serviceId"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD "serviceTypeId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD "ratings" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD "producerServiceId" integer`);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD "criteria" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD "rating" numeric(2,1) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Events" ADD "eventTypeId" integer`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD "leisureId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD "eventId" integer NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LeisurePostRating_user_post_event" ON "LeisurePostRatings" ("userId", "postId", "eventId") `);
        await queryRunner.query(`ALTER TABLE "EventRatings" ADD CONSTRAINT "UQ_8554c34b719c5fb7a75ef746231" UNIQUE ("userId", "eventId", "criteria")`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" ADD CONSTRAINT "FK_e0de8adac906d3dde81c83424c2" FOREIGN KEY ("wellnessId") REFERENCES "Wellness"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_be76d55343b8537afb4915237f4" FOREIGN KEY ("serviceTypeId") REFERENCES "WellnessServiceTypes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_d2e16efd486459d422801105dac" FOREIGN KEY ("producerServiceId") REFERENCES "ProducerServices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Events" ADD CONSTRAINT "FK_0ca63319e8a7c493f59b2de7f62" FOREIGN KEY ("eventTypeId") REFERENCES "EventTypes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_ae55921706b799a9382ad0f252f" FOREIGN KEY ("leisureId") REFERENCES "Leisure"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_fb49af21c4296d14a50e584dbd5" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_fb49af21c4296d14a50e584dbd5"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_ae55921706b799a9382ad0f252f"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP CONSTRAINT "FK_0ca63319e8a7c493f59b2de7f62"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_d2e16efd486459d422801105dac"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_be76d55343b8537afb4915237f4"`);
        await queryRunner.query(`ALTER TABLE "ProducerServices" DROP CONSTRAINT "FK_e0de8adac906d3dde81c83424c2"`);
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP CONSTRAINT "UQ_8554c34b719c5fb7a75ef746231"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LeisurePostRating_user_post_event"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP COLUMN "eventId"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP COLUMN "leisureId"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP COLUMN "eventTypeId"`);
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "EventRatings" DROP COLUMN "criteria"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP COLUMN "producerServiceId"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP COLUMN "ratings"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP COLUMN "serviceTypeId"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD "serviceId" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "EventTypes"`);
        await queryRunner.query(`DROP TABLE "ProducerServices"`);
        await queryRunner.query(`DROP TABLE "WellnessServiceTypes"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LeisurePostRating_user_post" ON "LeisurePostRatings" ("postId", "userId") `);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_986098e603bbe55ef6c75a46043" FOREIGN KEY ("serviceId") REFERENCES "ProducerService"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
