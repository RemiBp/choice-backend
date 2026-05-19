import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1753965886958 implements MigrationInterface {
    name = 'InitailSetup1753965886958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const idx1 = await queryRunner.query(`SELECT 1 FROM pg_indexes WHERE indexname='IDX_PostEmotion_userId_postId'`);
        if (idx1.length > 0) await queryRunner.query(`DROP INDEX "public"."IDX_PostEmotion_userId_postId"`);
        const col = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='PostEmotions' AND column_name='emotions'`);
        if (col.length > 0) await queryRunner.query(`ALTER TABLE "PostEmotions" RENAME COLUMN "emotions" TO "emotion"`);
        const enumOld = await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname='PostEmotions_emotions_enum'`);
        if (enumOld.length > 0) await queryRunner.query(`ALTER TYPE "public"."PostEmotions_emotions_enum" RENAME TO "PostEmotions_emotion_enum"`);
        const idx2 = await queryRunner.query(`SELECT 1 FROM pg_indexes WHERE indexname='IDX_PostEmotion_userId_postId_emotion'`);
        if (idx2.length === 0) await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostEmotion_userId_postId_emotion" ON "PostEmotions" ("userId", "postId", "emotion") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_PostEmotion_userId_postId_emotion"`);
        await queryRunner.query(`ALTER TYPE "public"."PostEmotions_emotion_enum" RENAME TO "PostEmotions_emotions_enum"`);
        await queryRunner.query(`ALTER TABLE "PostEmotions" RENAME COLUMN "emotion" TO "emotions"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostEmotion_userId_postId" ON "PostEmotions" ("postId", "userId") `);
    }

}
