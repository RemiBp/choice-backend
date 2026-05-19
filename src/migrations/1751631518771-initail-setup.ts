import { MigrationInterface, QueryRunner } from "typeorm";

export class InitailSetup1751631518771 implements MigrationInterface {
    name = 'InitailSetup1751631518771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`SELECT 1 FROM information_schema.tables WHERE table_name='EventBookings'`);
        if (tableExists.length === 0) {
            await queryRunner.query(`CREATE TABLE "EventBookings" ("id" SERIAL NOT NULL, "numberOfPersons" integer NOT NULL DEFAULT 1, "totalPrice" numeric(10,2), "isCancelled" boolean NOT NULL DEFAULT false, "isCheckedIn" boolean NOT NULL DEFAULT false, "internalNotes" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "userId" integer, "eventId" integer, CONSTRAINT "PK_EventBookings" PRIMARY KEY ("id"))`);
            await queryRunner.query(`ALTER TABLE "EventBookings" ADD CONSTRAINT "FK_EventBookings_userId" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            await queryRunner.query(`ALTER TABLE "EventBookings" ADD CONSTRAINT "FK_EventBookings_eventId" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        } else {
            const col1Exists = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='EventBookings' AND column_name='isCheckedIn'`);
            if (col1Exists.length === 0) await queryRunner.query(`ALTER TABLE "EventBookings" ADD "isCheckedIn" boolean NOT NULL DEFAULT false`);
            const col2Exists = await queryRunner.query(`SELECT 1 FROM information_schema.columns WHERE table_name='EventBookings' AND column_name='internalNotes'`);
            if (col2Exists.length === 0) await queryRunner.query(`ALTER TABLE "EventBookings" ADD "internalNotes" text`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EventBookings" DROP COLUMN "internalNotes"`);
        await queryRunner.query(`ALTER TABLE "EventBookings" DROP COLUMN "isCheckedIn"`);
    }

}
