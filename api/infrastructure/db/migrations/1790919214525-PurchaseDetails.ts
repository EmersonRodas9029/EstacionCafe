import { MigrationInterface, QueryRunner } from "typeorm";

export class PurchaseDetails1790919214525 implements MigrationInterface {
    name = 'PurchaseDetails1790919214525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "purchase_details" ("purchase_detail_id" SERIAL NOT NULL, "purchase_id" integer NOT NULL, "consumable_id" integer NOT NULL, "quantity" double precision NOT NULL, "unit_cost" numeric(10,2) NOT NULL, "sub_total" numeric(10,2) NOT NULL, CONSTRAINT "PK_ac66034c00e547da93379b51beb" PRIMARY KEY ("purchase_detail_id"))`);
        // cash_register no tenía FK: se conserva solo si apunta a una caja real
        await queryRunner.query(`ALTER TABLE "purchases" ADD "cash_register_id" integer`);
        await queryRunner.query(`UPDATE "purchases" p SET "cash_register_id" = p."cash_register" WHERE EXISTS (SELECT 1 FROM "cash_registers" c WHERE c."cash_register_id" = p."cash_register")`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "cash_register"`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "date" TYPE TIMESTAMP WITH TIME ZONE USING "date" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_78de0a12d23613fa20c6d38835e" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("cash_register_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_details" ADD CONSTRAINT "FK_7769941f7424a0030e1f6c7b7d3" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("purchase_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_details" ADD CONSTRAINT "FK_8cadcf090861b7f6c2406b9880e" FOREIGN KEY ("consumable_id") REFERENCES "Consumable"("consumable_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_details" DROP CONSTRAINT "FK_8cadcf090861b7f6c2406b9880e"`);
        await queryRunner.query(`ALTER TABLE "purchase_details" DROP CONSTRAINT "FK_7769941f7424a0030e1f6c7b7d3"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_78de0a12d23613fa20c6d38835e"`);
        await queryRunner.query(`ALTER TABLE "purchases" ALTER COLUMN "date" TYPE TIMESTAMP USING "date" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD "cash_register" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`UPDATE "purchases" SET "cash_register" = COALESCE("cash_register_id", 0)`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "cash_register_id"`);
        await queryRunner.query(`DROP TABLE "purchase_details"`);
    }

}
