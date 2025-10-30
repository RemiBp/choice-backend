import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportorBlockTables1760532621945 implements MigrationInterface {
    name = 'AddedReportorBlockTables1760532621945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "Interest" DROP CONSTRAINT "FK_0167ce6081d09215e54d2d61f08"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "suggestedSlotId"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "suggestedTime"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "respondedAt"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "updatedAt"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "declineReason"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" DROP COLUMN "suggestedMessage"`);
        // await queryRunner.query(`ALTER TABLE "Interest" DROP COLUMN "slotId"`);
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_timeofday_enum" AS ENUM('ALL_DAY', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT')`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ADD "timeOfDay" "public"."ProducerOffer_timeofday_enum" NOT NULL DEFAULT 'ALL_DAY'`);
        await queryRunner.query(`CREATE TYPE "public"."ProducerOffer_daysofweek_enum" AS ENUM('EVERYDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ADD "daysOfWeek" "public"."ProducerOffer_daysofweek_enum" array NOT NULL DEFAULT '{EVERYDAY}'`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" ADD "isTemplate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Producers" ADD "companyEmail" character varying`);
        // await queryRunner.query(`ALTER TYPE "public"."InterestInvite_status_enum" RENAME TO "InterestInvite_status_enum_old"`);
        // await queryRunner.query(`CREATE TYPE "public"."InterestInvite_status_enum" AS ENUM('Pending', 'Accepted', 'Declined')`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" DROP DEFAULT`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" TYPE "public"."InterestInvite_status_enum" USING "status"::"text"::"public"."InterestInvite_status_enum"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        // await queryRunner.query(`DROP TYPE "public"."InterestInvite_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."ProducerOffer_status_enum" ADD VALUE IF NOT EXISTS 'SENT';`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`CREATE TYPE "public"."InterestInvite_status_enum_old" AS ENUM('Pending', 'Accepted', 'Declined', 'SuggestedNewTime')`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" DROP DEFAULT`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" TYPE "public"."InterestInvite_status_enum_old" USING "status"::"text"::"public"."InterestInvite_status_enum_old"`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        // await queryRunner.query(`DROP TYPE "public"."InterestInvite_status_enum"`);
        // await queryRunner.query(`ALTER TYPE "public"."InterestInvite_status_enum_old" RENAME TO "InterestInvite_status_enum"`);
        await queryRunner.query(`ALTER TABLE "Producers" DROP COLUMN "companyEmail"`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" DROP COLUMN "isTemplate"`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" DROP COLUMN "daysOfWeek"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_daysofweek_enum"`);
        await queryRunner.query(`ALTER TABLE "ProducerOffer" DROP COLUMN "timeOfDay"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerOffer_timeofday_enum"`);
        // await queryRunner.query(`ALTER TABLE "Interest" ADD "slotId" integer`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "suggestedMessage" text`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "declineReason" text`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "respondedAt" TIMESTAMP WITH TIME ZONE`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "suggestedTime" TIMESTAMP WITH TIME ZONE`);
        // await queryRunner.query(`ALTER TABLE "InterestInvite" ADD "suggestedSlotId" integer`);
        // await queryRunner.query(`ALTER TABLE "Interest" ADD CONSTRAINT "FK_0167ce6081d09215e54d2d61f08" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
