import { MigrationInterface, QueryRunner } from "typeorm";

export class ServiceRatingTables1755596831704 implements MigrationInterface {
    name = 'ServiceRatingTables1755596831704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ProducerService" DROP CONSTRAINT "FK_0e8cced0e19d050c4e50dea7001"`);
        await queryRunner.query(`ALTER TABLE "ProducerService" RENAME COLUMN "producerId" TO "wellnessId"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP COLUMN "ratings"`);
        await queryRunner.query(`ALTER TABLE "ProducerService" ADD CONSTRAINT "FK_61be73efbd5439e52987d44c894" FOREIGN KEY ("wellnessId") REFERENCES "Wellness"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_986098e603bbe55ef6c75a46043" FOREIGN KEY ("serviceId") REFERENCES "ProducerService"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_986098e603bbe55ef6c75a46043"`);
        await queryRunner.query(`ALTER TABLE "ProducerService" DROP CONSTRAINT "FK_61be73efbd5439e52987d44c894"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD "ratings" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ProducerService" RENAME COLUMN "wellnessId" TO "producerId"`);
        await queryRunner.query(`ALTER TABLE "ProducerService" ADD CONSTRAINT "FK_0e8cced0e19d050c4e50dea7001" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
