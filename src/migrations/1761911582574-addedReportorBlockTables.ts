import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedReportorBlockTables1761911582574 implements MigrationInterface {
    name = 'AddedReportorBlockTables1761911582574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_ownertype_enum" AS ENUM('user', 'producer')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('free', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'expired', 'pending')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "ownerId" integer NOT NULL, "ownerType" "public"."subscriptions_ownertype_enum" NOT NULL, "plan" "public"."subscriptions_plan_enum" NOT NULL DEFAULT 'free', "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "autoRenew" boolean NOT NULL DEFAULT false, "provider" character varying(50), "providerSubscriptionId" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('purchase', 'renewal', 'refund', 'upgrade', 'downgrade')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('success', 'failed', 'pending')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_plan_enum" AS ENUM('free', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL, "plan" "public"."transactions_plan_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying, "providerTransactionId" character varying, "message" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "subscriptionId" integer, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "copilot_usage" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "totalQueries" integer NOT NULL DEFAULT '0', "monthlyQueries" integer NOT NULL DEFAULT '0', "lastResetAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d310fdd37ca31cc6d6a7f23c962" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."Producers_status_enum" RENAME TO "Producers_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Producers_status_enum" AS ENUM('pending', 'claimed', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" TYPE "public"."Producers_status_enum" USING "status"::"text"::"public"."Producers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."Producers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_68b3182f3f5d4d5a0f41c12139b" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "copilot_usage" ADD CONSTRAINT "FK_379334fe025ddc12f7727aa635f" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "copilot_usage" DROP CONSTRAINT "FK_379334fe025ddc12f7727aa635f"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_68b3182f3f5d4d5a0f41c12139b"`);
        await queryRunner.query(`CREATE TYPE "public"."Producers_status_enum_old" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" TYPE "public"."Producers_status_enum_old" USING "status"::"text"::"public"."Producers_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "Producers" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."Producers_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Producers_status_enum_old" RENAME TO "Producers_status_enum"`);
        await queryRunner.query(`DROP TABLE "copilot_usage"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_plan_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_plan_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_ownertype_enum"`);
    }

}
