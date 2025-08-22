import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostTagTable1755677400551 implements MigrationInterface {
    name = 'UpdatePostTagTable1755677400551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "PostTags" RENAME COLUMN "text" TO "tagId"`);
        await queryRunner.query(`CREATE TABLE "Tags" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_61aa7408a426fea5dd8416f5a12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8b1d1866e77403e234680dcb80" ON "Tags" ("name") `);
        await queryRunner.query(`ALTER TABLE "Posts" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "PostTags" DROP COLUMN "tagId"`);
        await queryRunner.query(`ALTER TABLE "PostTags" ADD "tagId" integer`);
        await queryRunner.query(`ALTER TABLE "PostTags" ADD CONSTRAINT "UQ_9ef4840f60f7e0d0f11322a2799" UNIQUE ("postId", "tagId")`);
        await queryRunner.query(`ALTER TABLE "PostTags" ADD CONSTRAINT "FK_9a2040b49254a0a0ba561d6970a" FOREIGN KEY ("tagId") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "PostTags" DROP CONSTRAINT "FK_9a2040b49254a0a0ba561d6970a"`);
        await queryRunner.query(`ALTER TABLE "PostTags" DROP CONSTRAINT "UQ_9ef4840f60f7e0d0f11322a2799"`);
        await queryRunner.query(`ALTER TABLE "PostTags" DROP COLUMN "tagId"`);
        await queryRunner.query(`ALTER TABLE "PostTags" ADD "tagId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Posts" ADD "tags" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b1d1866e77403e234680dcb80"`);
        await queryRunner.query(`DROP TABLE "Tags"`);
        await queryRunner.query(`ALTER TABLE "PostTags" RENAME COLUMN "tagId" TO "text"`);
    }

}
