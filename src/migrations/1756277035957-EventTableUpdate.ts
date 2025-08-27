import { MigrationInterface, QueryRunner } from "typeorm";

export class EventTableUpdate1756277035957 implements MigrationInterface {
    name = 'EventTableUpdate1756277035957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Events" RENAME COLUMN "EventType" TO "serviceType"`);
        await queryRunner.query(`ALTER TYPE "public"."Events_eventtype_enum" RENAME TO "Events_servicetype_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."Events_servicetype_enum" RENAME TO "Events_eventtype_enum"`);
        await queryRunner.query(`ALTER TABLE "Events" RENAME COLUMN "serviceType" TO "EventType"`);
    }

}
