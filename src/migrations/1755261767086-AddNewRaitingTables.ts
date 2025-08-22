import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewRaitingTables1755261767086 implements MigrationInterface {
    name = 'AddNewRaitingTables1755261767086'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "WellnessPostRatings" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "careQuality" numeric(2,1) NOT NULL, "cleanliness" numeric(2,1) NOT NULL, "welcome" numeric(2,1) NOT NULL, "valueForMoney" numeric(2,1) NOT NULL, "atmosphere" numeric(2,1) NOT NULL, "staffExperience" numeric(2,1) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_41f6ac5668c0b8d660cf1a5fb95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_WellnessPostRating_user_post" ON "WellnessPostRatings" ("userId", "postId") `);
        await queryRunner.query(`CREATE TABLE "WellnessRatings" ("id" SERIAL NOT NULL, "producerId" integer NOT NULL, "careQuality" numeric(2,1) NOT NULL DEFAULT '0', "cleanliness" numeric(2,1) NOT NULL DEFAULT '0', "welcome" numeric(2,1) NOT NULL DEFAULT '0', "valueForMoney" numeric(2,1) NOT NULL DEFAULT '0', "atmosphere" numeric(2,1) NOT NULL DEFAULT '0', "staffExperience" numeric(2,1) NOT NULL DEFAULT '0', "overall" numeric(2,1) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_117ca34c551577023c6a85e602b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_WellnessRating_producerId" ON "WellnessRatings" ("producerId") `);
        await queryRunner.query(`CREATE TABLE "RestaurantRatings" ("id" SERIAL NOT NULL, "producerId" integer NOT NULL, "service" numeric(2,1) NOT NULL DEFAULT '0', "place" numeric(2,1) NOT NULL DEFAULT '0', "portions" numeric(2,1) NOT NULL DEFAULT '0', "ambiance" numeric(2,1) NOT NULL DEFAULT '0', "overall" numeric(2,1) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_15df07e2131902dc1e80c094eea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_RestaurantRating_producerId" ON "RestaurantRatings" ("producerId") `);
        await queryRunner.query(`CREATE TABLE "RestaurantPostRatings" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "service" numeric(2,1) NOT NULL, "place" numeric(2,1) NOT NULL, "portions" numeric(2,1) NOT NULL, "ambiance" numeric(2,1) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_56f888ef3fa73a11cc191c3d16c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_RestaurantPostRating_user_post" ON "RestaurantPostRatings" ("userId", "postId") `);
        await queryRunner.query(`CREATE TABLE "LeisureRatings" ("id" SERIAL NOT NULL, "producerId" integer NOT NULL, "stageDirection" numeric(2,1) NOT NULL DEFAULT '0', "actorPerformance" numeric(2,1) NOT NULL DEFAULT '0', "textQuality" numeric(2,1) NOT NULL DEFAULT '0', "scenography" numeric(2,1) NOT NULL DEFAULT '0', "overall" numeric(2,1) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3717b5ad6284b83d783c725c2f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LeisureRating_producerId" ON "LeisureRatings" ("producerId") `);
        await queryRunner.query(`CREATE TABLE "LeisurePostRatings" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "stageDirection" numeric(2,1) NOT NULL, "actorPerformance" numeric(2,1) NOT NULL, "textQuality" numeric(2,1) NOT NULL, "scenography" numeric(2,1) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a57b5cfd337e830a4b85c02378e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_LeisurePostRating_user_post" ON "LeisurePostRatings" ("userId", "postId") `);
        await queryRunner.query(`ALTER TABLE "WellnessPostRatings" ADD CONSTRAINT "FK_4be5a8b014eb672e9c5372719e6" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "WellnessPostRatings" ADD CONSTRAINT "FK_04829701114b3af8ee7e4b3b628" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD CONSTRAINT "FK_5804e1c2c3d52720ccf8eab9fe8" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" ADD CONSTRAINT "FK_a6a3af782b6aa1a81ab6bc9e20a" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RestaurantPostRatings" ADD CONSTRAINT "FK_1764130e91d62cea548d0043c0c" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RestaurantPostRatings" ADD CONSTRAINT "FK_d61598cfe4324620c06ae8d2a8c" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" ADD CONSTRAINT "FK_f805a2d26e31c8c79d3ed9a633a" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_29349e98e9a60f4b730f8be2d54" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" ADD CONSTRAINT "FK_4aae84e0bfb04ce3c79de0441b8" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_4aae84e0bfb04ce3c79de0441b8"`);
        await queryRunner.query(`ALTER TABLE "LeisurePostRatings" DROP CONSTRAINT "FK_29349e98e9a60f4b730f8be2d54"`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" DROP CONSTRAINT "FK_f805a2d26e31c8c79d3ed9a633a"`);
        await queryRunner.query(`ALTER TABLE "RestaurantPostRatings" DROP CONSTRAINT "FK_d61598cfe4324620c06ae8d2a8c"`);
        await queryRunner.query(`ALTER TABLE "RestaurantPostRatings" DROP CONSTRAINT "FK_1764130e91d62cea548d0043c0c"`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" DROP CONSTRAINT "FK_a6a3af782b6aa1a81ab6bc9e20a"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP CONSTRAINT "FK_5804e1c2c3d52720ccf8eab9fe8"`);
        await queryRunner.query(`ALTER TABLE "WellnessPostRatings" DROP CONSTRAINT "FK_04829701114b3af8ee7e4b3b628"`);
        await queryRunner.query(`ALTER TABLE "WellnessPostRatings" DROP CONSTRAINT "FK_4be5a8b014eb672e9c5372719e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LeisurePostRating_user_post"`);
        await queryRunner.query(`DROP TABLE "LeisurePostRatings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LeisureRating_producerId"`);
        await queryRunner.query(`DROP TABLE "LeisureRatings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_RestaurantPostRating_user_post"`);
        await queryRunner.query(`DROP TABLE "RestaurantPostRatings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_RestaurantRating_producerId"`);
        await queryRunner.query(`DROP TABLE "RestaurantRatings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_WellnessRating_producerId"`);
        await queryRunner.query(`DROP TABLE "WellnessRatings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_WellnessPostRating_user_post"`);
        await queryRunner.query(`DROP TABLE "WellnessPostRatings"`);
    }

}
