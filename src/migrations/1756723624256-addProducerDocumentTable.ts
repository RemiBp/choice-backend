import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProducerDocumentTable1756723624256 implements MigrationInterface {
    name = 'AddProducerDocumentTable1756723624256'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "producer_documents" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "fileUrl" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "producerId" integer, CONSTRAINT "PK_3f30fff39cc708b7fcdd1d16904" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "producer_documents" ADD CONSTRAINT "FK_f7015ddd5960828c7b752f73e45" FOREIGN KEY ("producerId") REFERENCES "Producers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "producer_documents" DROP CONSTRAINT "FK_f7015ddd5960828c7b752f73e45"`);
        await queryRunner.query(`DROP TABLE "producer_documents"`);
    }

}
