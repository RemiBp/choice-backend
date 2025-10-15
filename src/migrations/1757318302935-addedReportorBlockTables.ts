import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportorBlockTables1757318302935 implements MigrationInterface {
    name = 'AddedReportorBlockTables1757318302935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "ProducerOffer" ("id" SERIAL NOT NULL, "producerId" integer NOT NULL, "title" character varying NOT NULL, "message" character varying NOT NULL, "discountPercent" integer, "validityMinutes" integer, "maxRecipients" integer, "radiusMeters" integer, "imageUrl" character varying, "status" "public"."ProducerOffer_status_enum" NOT NULL DEFAULT 'DRAFT', "scheduledAt" TIMESTAMP, "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "PK_d5312af0602936e141127c4bff8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Reports_reason_enum" AS ENUM('Spam or Fake Account', 'Inappropriate Content', 'Harassment or Bullying', 'Hate Speech', 'Scam or Fraud')`);
        await queryRunner.query(`CREATE TYPE "public"."Reports_status_enum" AS ENUM('pending', 'reviewed', 'resolved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "Reports" ("id" SERIAL NOT NULL, "reporterId" integer NOT NULL, "reportedUserId" integer, "reportedPostId" integer, "reportedCommentId" integer, "reason" "public"."Reports_reason_enum" NOT NULL, "details" text, "status" "public"."Reports_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a8d9b443fb3a7f925e217dcd5aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Blocks" ("id" SERIAL NOT NULL, "blockerId" integer NOT NULL, "blockedUserId" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c99923c5bbffa51066b8f5eb882" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ADD CONSTRAINT "FK_66e0dd04c5635503efc154aab68" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Reports" ADD CONSTRAINT "FK_baeed54d45c462d405473bd60f8" FOREIGN KEY ("reporterId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Reports" ADD CONSTRAINT "FK_a1c7df3ba0844dc8f12e03bcc22" FOREIGN KEY ("reportedUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Reports" ADD CONSTRAINT "FK_53d77b9b99d5d3139a2811937fa" FOREIGN KEY ("reportedPostId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Reports" ADD CONSTRAINT "FK_421c5d289db92a6b48bb475e857" FOREIGN KEY ("reportedCommentId") REFERENCES "PostComments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Blocks" ADD CONSTRAINT "FK_bb950328dd07a9fbc3e546c3223" FOREIGN KEY ("blockerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Blocks" ADD CONSTRAINT "FK_e0687a021542dacd73f5043cd14" FOREIGN KEY ("blockedUserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Blocks" DROP CONSTRAINT "FK_e0687a021542dacd73f5043cd14"`);
        await queryRunner.query(`ALTER TABLE "Blocks" DROP CONSTRAINT "FK_bb950328dd07a9fbc3e546c3223"`);
        await queryRunner.query(`ALTER TABLE "Reports" DROP CONSTRAINT "FK_421c5d289db92a6b48bb475e857"`);
        await queryRunner.query(`ALTER TABLE "Reports" DROP CONSTRAINT "FK_53d77b9b99d5d3139a2811937fa"`);
        await queryRunner.query(`ALTER TABLE "Reports" DROP CONSTRAINT "FK_a1c7df3ba0844dc8f12e03bcc22"`);
        await queryRunner.query(`ALTER TABLE "Reports" DROP CONSTRAINT "FK_baeed54d45c462d405473bd60f8"`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" DROP CONSTRAINT "FK_66e0dd04c5635503efc154aab68"`);
        await queryRunner.query(`DROP TABLE "Blocks"`);
        await queryRunner.query(`DROP TABLE "Reports"`);
        await queryRunner.query(`DROP TYPE "public"."Reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Reports_reason_enum"`);
        await queryRunner.query(`DROP TABLE "ProducerOffer"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_status_enum"`);
    }

}
