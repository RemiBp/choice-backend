import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServicesType1755520845429 implements MigrationInterface {
    name = 'AddServicesType1755520845429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ProducerService_type_enum" AS ENUM('Tour', 'Workshop', 'Concert', 'Game', 'Exhibition')`);
        await queryRunner.query(`CREATE TABLE "ProducerService" ("id" SERIAL NOT NULL, "type" "public"."ProducerService_type_enum" NOT NULL, "producerId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_74b434f80575675b3c22a218405" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ServiceRatings" ("id" SERIAL NOT NULL, "ratings" jsonb NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "serviceTypeId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4caacd28c002a6cdc2f66f448e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Producers" DROP COLUMN "serviceType"`);
        await queryRunner.query(`DROP TYPE "public"."Producers_servicetype_enum"`);
        await queryRunner.query(`ALTER TABLE "ProducerService" ADD CONSTRAINT "FK_0e8cced0e19d050c4e50dea7001" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_f11d2d0a26932656200d9598913" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_e32b2e88aa9bdabf499b4562c4e" FOREIGN KEY ("postId") REFERENCES "Posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" ADD CONSTRAINT "FK_be76d55343b8537afb4915237f4" FOREIGN KEY ("serviceTypeId") REFERENCES "ProducerService"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_be76d55343b8537afb4915237f4"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_e32b2e88aa9bdabf499b4562c4e"`);
        await queryRunner.query(`ALTER TABLE "ServiceRatings" DROP CONSTRAINT "FK_f11d2d0a26932656200d9598913"`);
        await queryRunner.query(`ALTER TABLE "ProducerService" DROP CONSTRAINT "FK_0e8cced0e19d050c4e50dea7001"`);
        await queryRunner.query(`CREATE TYPE "public"."Producers_servicetype_enum" AS ENUM('Tour', 'Workshop', 'Concert', 'Game', 'Exhibition')`);
        await queryRunner.query(`ALTER TABLE "Producers" ADD "serviceType" "public"."Producers_servicetype_enum"`);
        await queryRunner.query(`DROP TABLE "ServiceRatings"`);
        await queryRunner.query(`DROP TABLE "ProducerService"`);
        await queryRunner.query(`DROP TYPE "public"."ProducerService_type_enum"`);
    }

}
