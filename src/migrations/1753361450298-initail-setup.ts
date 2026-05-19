import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1753361450298 implements MigrationInterface {
    name = 'InitailSetup1753361450298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const c1 = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname='FK_6666a9ed428d81b71cf108fd33e'`);
        if (c1.length > 0) await queryRunner.query(`ALTER TABLE "OperationalHour" DROP CONSTRAINT "FK_6666a9ed428d81b71cf108fd33e"`);
        const c2 = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname='FK_2260da6950bf8ff06e813ca0dd3'`);
        if (c2.length > 0) await queryRunner.query(`ALTER TABLE "Slot" DROP CONSTRAINT "FK_2260da6950bf8ff06e813ca0dd3"`);
        const renameCol = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='OperationalHour' AND column_name='producerId'`);
        if (renameCol.length > 0) await queryRunner.query(`ALTER TABLE "OperationalHour" RENAME COLUMN "producerId" TO "userId"`);
        await queryRunner.query(`CREATE TYPE "public"."Posts_type_enum" AS ENUM('wellness', 'leisure', 'restaurant', 'event', 'simple')`);
        await queryRunner.query(`CREATE TYPE "public"."Posts_status_enum" AS ENUM('public', 'private', 'friends_only', 'draft', 'restricted')`);
        await queryRunner.query(`CREATE TABLE "Posts" ("id" SERIAL NOT NULL, "type" "public"."Posts_type_enum" NOT NULL, "status" "public"."Posts_status_enum" NOT NULL DEFAULT 'draft', "publishDate" TIMESTAMP WITH TIME ZONE, "description" text NOT NULL, "coverImage" character varying, "link" character varying, "tags" text array NOT NULL DEFAULT '{}', "likesCount" integer NOT NULL DEFAULT '0', "shareCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "overallAvgRating" numeric(3,2), "userId" integer, "producerId" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0f050d6d1112b2d07545b43f945" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_036f20ae74b236c8cfa38d5092" ON "Posts" ("isDeleted") `);
        await queryRunner.query(`CREATE TABLE "PostLikes" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f28e59e14e5f90fbd763c541751" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_455c9d7acb655c78026daad467" ON "PostLikes" ("isDeleted") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostLike_userId_postId" ON "PostLikes" ("userId", "postId") `);
        await queryRunner.query(`CREATE TABLE "PostComments" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "comment" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_2440dc3d7ccd7aff688fc008336" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_11ce5db00f1a83af2cb67199d0" ON "PostComments" ("isDeleted") `);
        await queryRunner.query(`CREATE TABLE "PostShares" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4784000021cb31369334aed1972" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e001ba55c1f4d1d00987e2562b" ON "PostShares" ("isDeleted") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostShare_userId_postId" ON "PostShares" ("userId", "postId") `);
        await queryRunner.query(`CREATE TABLE "PostTags" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "text" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_937491eef9e2789a3a62bec5333" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e5eb5634f869a345b0ec2b801c" ON "PostTags" ("isDeleted") `);
        await queryRunner.query(`CREATE TYPE "public"."PostEmotions_emotion_enum" AS ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry')`);
        await queryRunner.query(`CREATE TABLE "PostEmotions" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "emotion" "public"."PostEmotions_emotion_enum" NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4dc3ce8ac912940ad83aa2caacc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f75179c792108d7dcffccc219d" ON "PostEmotions" ("isDeleted") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostEmotion_userId_postId" ON "PostEmotions" ("userId", "postId") `);
        await queryRunner.query(`CREATE TABLE "PostRatings" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "criteria" character varying NOT NULL, "rating" numeric(2,1) NOT NULL, "comment" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "CHK_1e80bb1ebcef21b1f411805e90" CHECK ("rating" >= 0 AND "rating" <= 5), CONSTRAINT "PK_b23ccc8c7984c703ba0202d4ae8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_001ac5868ae2943def5b784fe1" ON "PostRatings" ("isDeleted") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_PostRating_userId_postId_criteria" ON "PostRatings" ("userId", "postId", "criteria") `);
        await queryRunner.query(`CREATE TYPE "public"."RatingConfigurations_posttype_enum" AS ENUM('wellness', 'leisure', 'restaurant', 'event', 'simple')`);
        await queryRunner.query(`CREATE TABLE "RatingConfigurations" ("id" SERIAL NOT NULL, "postType" "public"."RatingConfigurations_posttype_enum" NOT NULL, "criteria" character varying NOT NULL, "displayName" character varying NOT NULL, "description" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d3d743da0ee3c51c8510e78fee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_RatingConfiguration_postType_criteria" ON "RatingConfigurations" ("postType", "criteria") `);
        await queryRunner.query(`CREATE TABLE "PostStatistics" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "totalLikes" integer NOT NULL DEFAULT '0', "totalShares" integer NOT NULL DEFAULT '0', "totalComments" integer NOT NULL DEFAULT '0', "totalRatings" integer NOT NULL DEFAULT '0', "averageRating" numeric(3,2), "criteriaRatings" jsonb, "emotionCounts" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a42a8cc0af3ed7441fa6a27695e" UNIQUE ("postId"), CONSTRAINT "REL_a42a8cc0af3ed7441fa6a27695" UNIQUE ("postId"), CONSTRAINT "PK_45f1f9305dfa4b99c744a6358f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "PostImages" ("id" SERIAL NOT NULL, "postId" integer NOT NULL, "url" character varying NOT NULL, "isCoverImage" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "isDeleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_df4d5c03340957932d47e24181c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a5895e904fa7628e8d67d18b91" ON "PostImages" ("isDeleted") `);
        const slotDurCol = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='Producers' AND column_name='slotDuration'`);
        if (slotDurCol.length > 0) await queryRunner.query(`ALTER TABLE "Producers" DROP COLUMN "slotDuration"`);
        const slotProdCol = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='Slot' AND column_name='producerId'`);
        if (slotProdCol.length > 0) await queryRunner.query(`ALTER TABLE "Slot" DROP COLUMN "producerId"`);
        const tpCol = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='EventBookings' AND column_name='totalPrice'`);
        if (tpCol.length > 0) await queryRunner.query(`ALTER TABLE "EventBookings" DROP COLUMN "totalPrice"`);
        const ohProdCol = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='OpeningHours' AND column_name='producerId'`);
        if (ohProdCol.length === 0) await queryRunner.query(`ALTER TABLE "OpeningHours" ADD "producerId" integer`);
        const ohUq = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname='UQ_ce65ca2b119b97df3650773d571'`);
        if (ohUq.length === 0) await queryRunner.query(`ALTER TABLE "OpeningHours" ADD CONSTRAINT "UQ_ce65ca2b119b97df3650773d571" UNIQUE ("producerId")`);
        const fkConstraints: Array<{name: string, sql: string}> = [
            { name: 'FK_896282abbca19854762c4de384a', sql: `ALTER TABLE "OperationalHour" ADD CONSTRAINT "FK_896282abbca19854762c4de384a" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_ce65ca2b119b97df3650773d571', sql: `ALTER TABLE "OpeningHours" ADD CONSTRAINT "FK_ce65ca2b119b97df3650773d571" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_a8237eded7a9a311081b65ed0b8', sql: `ALTER TABLE "Posts" ADD CONSTRAINT "FK_a8237eded7a9a311081b65ed0b8" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_88811d025c8b8574fa26fbfdf2f', sql: `ALTER TABLE "Posts" ADD CONSTRAINT "FK_88811d025c8b8574fa26fbfdf2f" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_a931f62e10da42b6a74f7a4fe79', sql: `ALTER TABLE "PostLikes" ADD CONSTRAINT "FK_a931f62e10da42b6a74f7a4fe79" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_acad3c28cf8d94318cf07d2c891', sql: `ALTER TABLE "PostLikes" ADD CONSTRAINT "FK_acad3c28cf8d94318cf07d2c891" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_33fa6d1609cacfb6b25d580144b', sql: `ALTER TABLE "PostComments" ADD CONSTRAINT "FK_33fa6d1609cacfb6b25d580144b" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_1447229657793c6cd181e3f32aa', sql: `ALTER TABLE "PostComments" ADD CONSTRAINT "FK_1447229657793c6cd181e3f32aa" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_5f103aa4019e86ed3301843828f', sql: `ALTER TABLE "PostShares" ADD CONSTRAINT "FK_5f103aa4019e86ed3301843828f" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_d7580b2e9589c425b64cc7266f8', sql: `ALTER TABLE "PostShares" ADD CONSTRAINT "FK_d7580b2e9589c425b64cc7266f8" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_d4d36ff9d468f0feb0f4965ac76', sql: `ALTER TABLE "PostTags" ADD CONSTRAINT "FK_d4d36ff9d468f0feb0f4965ac76" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_fdea93b412bb75adf5987de3d9e', sql: `ALTER TABLE "PostTags" ADD CONSTRAINT "FK_fdea93b412bb75adf5987de3d9e" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_84c7f09be7f45867e255886f862', sql: `ALTER TABLE "PostEmotions" ADD CONSTRAINT "FK_84c7f09be7f45867e255886f862" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_55cccdcf6a4592e196b0a04e14a', sql: `ALTER TABLE "PostEmotions" ADD CONSTRAINT "FK_55cccdcf6a4592e196b0a04e14a" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_8105a418c30e139b1f09f9ba56f', sql: `ALTER TABLE "PostRatings" ADD CONSTRAINT "FK_8105a418c30e139b1f09f9ba56f" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_add280f6de71689396aaaf8a3be', sql: `ALTER TABLE "PostRatings" ADD CONSTRAINT "FK_add280f6de71689396aaaf8a3be" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_a42a8cc0af3ed7441fa6a27695e', sql: `ALTER TABLE "PostStatistics" ADD CONSTRAINT "FK_a42a8cc0af3ed7441fa6a27695e" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
            { name: 'FK_fff212cb129560f0a2cdf1582b3', sql: `ALTER TABLE "PostImages" ADD CONSTRAINT "FK_fff212cb129560f0a2cdf1582b3" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION` },
        ];
        for (const fk of fkConstraints) {
            const exists = await queryRunner.query(`SELECT 1 FROM pg_constraint WHERE conname='${fk.name}'`);
            if (exists.length === 0) await queryRunner.query(fk.sql);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "PostImages" DROP CONSTRAINT "FK_fff212cb129560f0a2cdf1582b3"`);
        await queryRunner.query(`ALTER TABLE "PostStatistics" DROP CONSTRAINT "FK_a42a8cc0af3ed7441fa6a27695e"`);
        await queryRunner.query(`ALTER TABLE "PostRatings" DROP CONSTRAINT "FK_add280f6de71689396aaaf8a3be"`);
        await queryRunner.query(`ALTER TABLE "PostRatings" DROP CONSTRAINT "FK_8105a418c30e139b1f09f9ba56f"`);
        await queryRunner.query(`ALTER TABLE "PostEmotions" DROP CONSTRAINT "FK_55cccdcf6a4592e196b0a04e14a"`);
        await queryRunner.query(`ALTER TABLE "PostEmotions" DROP CONSTRAINT "FK_84c7f09be7f45867e255886f862"`);
        await queryRunner.query(`ALTER TABLE "PostTags" DROP CONSTRAINT "FK_fdea93b412bb75adf5987de3d9e"`);
        await queryRunner.query(`ALTER TABLE "PostTags" DROP CONSTRAINT "FK_d4d36ff9d468f0feb0f4965ac76"`);
        await queryRunner.query(`ALTER TABLE "PostShares" DROP CONSTRAINT "FK_d7580b2e9589c425b64cc7266f8"`);
        await queryRunner.query(`ALTER TABLE "PostShares" DROP CONSTRAINT "FK_5f103aa4019e86ed3301843828f"`);
        await queryRunner.query(`ALTER TABLE "PostComments" DROP CONSTRAINT "FK_1447229657793c6cd181e3f32aa"`);
        await queryRunner.query(`ALTER TABLE "PostComments" DROP CONSTRAINT "FK_33fa6d1609cacfb6b25d580144b"`);
        await queryRunner.query(`ALTER TABLE "PostLikes" DROP CONSTRAINT "FK_acad3c28cf8d94318cf07d2c891"`);
        await queryRunner.query(`ALTER TABLE "PostLikes" DROP CONSTRAINT "FK_a931f62e10da42b6a74f7a4fe79"`);
        await queryRunner.query(`ALTER TABLE "Posts" DROP CONSTRAINT "FK_88811d025c8b8574fa26fbfdf2f"`);
        await queryRunner.query(`ALTER TABLE "Posts" DROP CONSTRAINT "FK_a8237eded7a9a311081b65ed0b8"`);
        await queryRunner.query(`ALTER TABLE "OpeningHours" DROP CONSTRAINT "FK_ce65ca2b119b97df3650773d571"`);
        await queryRunner.query(`ALTER TABLE "OperationalHour" DROP CONSTRAINT "FK_896282abbca19854762c4de384a"`);
        await queryRunner.query(`ALTER TABLE "OpeningHours" DROP CONSTRAINT "UQ_ce65ca2b119b97df3650773d571"`);
        await queryRunner.query(`ALTER TABLE "OpeningHours" DROP COLUMN "producerId"`);
        await queryRunner.query(`ALTER TABLE "EventBookings" ADD "totalPrice" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "Slot" ADD "producerId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Producers" ADD "slotDuration" integer`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5895e904fa7628e8d67d18b91"`);
        await queryRunner.query(`DROP TABLE "PostImages"`);
        await queryRunner.query(`DROP TABLE "PostStatistics"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_RatingConfiguration_postType_criteria"`);
        await queryRunner.query(`DROP TABLE "RatingConfigurations"`);
        await queryRunner.query(`DROP TYPE "public"."RatingConfigurations_posttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PostRating_userId_postId_criteria"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_001ac5868ae2943def5b784fe1"`);
        await queryRunner.query(`DROP TABLE "PostRatings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PostEmotion_userId_postId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f75179c792108d7dcffccc219d"`);
        await queryRunner.query(`DROP TABLE "PostEmotions"`);
        await queryRunner.query(`DROP TYPE "public"."PostEmotions_emotion_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5eb5634f869a345b0ec2b801c"`);
        await queryRunner.query(`DROP TABLE "PostTags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PostShare_userId_postId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e001ba55c1f4d1d00987e2562b"`);
        await queryRunner.query(`DROP TABLE "PostShares"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11ce5db00f1a83af2cb67199d0"`);
        await queryRunner.query(`DROP TABLE "PostComments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PostLike_userId_postId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_455c9d7acb655c78026daad467"`);
        await queryRunner.query(`DROP TABLE "PostLikes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_036f20ae74b236c8cfa38d5092"`);
        await queryRunner.query(`DROP TABLE "Posts"`);
        await queryRunner.query(`DROP TYPE "public"."Posts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Posts_type_enum"`);
        await queryRunner.query(`ALTER TABLE "OperationalHour" RENAME COLUMN "userId" TO "producerId"`);
        await queryRunner.query(`ALTER TABLE "Slot" ADD CONSTRAINT "FK_2260da6950bf8ff06e813ca0dd3" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "OperationalHour" ADD CONSTRAINT "FK_6666a9ed428d81b71cf108fd33e" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
