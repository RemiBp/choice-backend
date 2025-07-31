import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1753965886958 implements MigrationInterface {
    name = 'InitailSetup1753965886958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_PostEmotion_userId_postId"`);
        await queryRunner.query(`ALTER TABLE "PostEmotions" RENAME COLUMN "emotions" TO "emotion"`);
        await queryRunner.query(`ALTER TYPE "public"."PostEmotions_emotions_enum" RENAME TO "PostEmotions_emotion_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostEmotion_userId_postId_emotion" ON "PostEmotions" ("userId", "postId", "emotion") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_PostEmotion_userId_postId_emotion"`);
        await queryRunner.query(`ALTER TYPE "public"."PostEmotions_emotion_enum" RENAME TO "PostEmotions_emotions_enum"`);
        await queryRunner.query(`ALTER TABLE "PostEmotions" RENAME COLUMN "emotion" TO "emotions"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostEmotion_userId_postId" ON "PostEmotions" ("postId", "userId") `);
    }

}
