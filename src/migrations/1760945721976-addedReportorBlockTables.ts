import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportorBlockTables1760945721976 implements MigrationInterface {
    name = 'AddedReportorBlockTables1760945721976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "Interest" DROP CONSTRAINT "FK_0167ce6081d09215e54d2d61f08"`);
        await queryRunner.query(`CREATE TYPE "public"."LocationPrivacy_mode_enum" AS ENUM('NOT_SHARED', 'MY_FRIENDS', 'MY_FRIENDS_EXCEPT', 'ONLY_THESE_FRIENDS')`);
        await queryRunner.query(`CREATE TABLE "LocationPrivacy" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "isSharingEnabled" boolean NOT NULL DEFAULT true, "mode" "public"."LocationPrivacy_mode_enum" NOT NULL DEFAULT 'NOT_SHARED', "includedFriendIds" integer array NOT NULL DEFAULT '{}', "excludedFriendIds" integer array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "PK_99bd82b6871927d536bdc6abd9b" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "suggestedSlotId"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "suggestedTime"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "respondedAt"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "updatedAt"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "declineReason"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "suggestedMessage"`);
        // await queryRunner.query(`ALTER TABLE "Interest" DROP COLUMN "slotId"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "locationPrivacyId" integer`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "UQ_10914a69ebf39206cbbe6181674" UNIQUE ("locationPrivacyId")`);
        // await queryRunner.query(`ALTER TYPE "public"."InterestInvite_status_enum" RENAME TO "InterestInvite_status_enum_old"`);
        // await queryRunner.query(`CREATE TYPE "public"."InterestInvite_status_enum" AS ENUM('Pending', 'Accepted', 'Declined')`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" DROP DEFAULT`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" TYPE "public"."InterestInvite_status_enum" USING "status"::"text"::"public"."InterestInvite_status_enum"`);
        // // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        // await queryRunner.query(`DROP TYPE "public"."InterestInvite_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "LocationPrivacy" ADD CONSTRAINT "FK_1861714320be8f2681665fb8e70" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "FK_10914a69ebf39206cbbe6181674" FOREIGN KEY ("locationPrivacyId") REFERENCES "LocationPrivacy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "FK_10914a69ebf39206cbbe6181674"`);
        await queryRunner.query(`ALTER TABLE "LocationPrivacy" DROP CONSTRAINT "FK_1861714320be8f2681665fb8e70"`);
        // await queryRunner.query(`CREATE TYPE "public"."InterestInvite_status_enum_old" AS ENUM('Pending', 'Accepted', 'Declined', 'SuggestedNewTime')`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" DROP DEFAULT`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" TYPE "public"."InterestInvite_status_enum_old" USING "status"::"text"::"public"."InterestInvite_status_enum_old"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        // await queryRunner.query(`DROP TYPE "public"."InterestInvite_status_enum"`);
        // await queryRunner.query(`ALTER TYPE "public"."InterestInvite_status_enum_old" RENAME TO "InterestInvite_status_enum"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "UQ_10914a69ebf39206cbbe6181674"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "locationPrivacyId"`);
        // await queryRunner.query(`ALTER TABLE "Interest" ADD "slotId" integer`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "suggestedMessage" text`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "declineReason" text`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "respondedAt" TIMESTAMP WITH TIME ZONE`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "suggestedTime" TIMESTAMP WITH TIME ZONE`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "suggestedSlotId" integer`);
        await queryRunner.query(`DROP TABLE "LocationPrivacy"`);
        await queryRunner.query(`DROP TYPE "public"."LocationPrivacy_mode_enum"`);
        // await queryRunner.query(`ALTER TABLE "Interest" ADD CONSTRAINT "FK_0167ce6081d09215e54d2d61f08" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
