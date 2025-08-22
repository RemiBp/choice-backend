import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedAIRaitingFields1755264118269 implements MigrationInterface {
    name = 'AddedAIRaitingFields1755264118269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_careQuality" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_cleanliness" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_welcome" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_valueForMoney" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_atmosphere" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_staffExperience" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" ADD "ai_overall" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" ADD "ai_service" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" ADD "ai_place" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" ADD "ai_portions" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" ADD "ai_ambiance" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" ADD "ai_overall" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" ADD "ai_stageDirection" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" ADD "ai_actorPerformance" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" ADD "ai_textQuality" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" ADD "ai_scenography" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" ADD "ai_overall" numeric(2,1) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeisureRatings" DROP COLUMN "ai_overall"`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" DROP COLUMN "ai_scenography"`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" DROP COLUMN "ai_textQuality"`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" DROP COLUMN "ai_actorPerformance"`);
        await queryRunner.query(`ALTER TABLE "LeisureRatings" DROP COLUMN "ai_stageDirection"`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" DROP COLUMN "ai_overall"`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" DROP COLUMN "ai_ambiance"`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" DROP COLUMN "ai_portions"`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" DROP COLUMN "ai_place"`);
        await queryRunner.query(`ALTER TABLE "RestaurantRatings" DROP COLUMN "ai_service"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_overall"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_staffExperience"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_atmosphere"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_valueForMoney"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_welcome"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_cleanliness"`);
        await queryRunner.query(`ALTER TABLE "WellnessRatings" DROP COLUMN "ai_careQuality"`);
    }

}
