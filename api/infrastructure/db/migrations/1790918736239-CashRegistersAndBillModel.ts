import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * - bills.cash_register (FK a users) pasa a ser bills.waiter_id: siempre guardó al usuario.
 * - Nueva tabla cash_registers y bills.cash_register_id (caja donde se cobró).
 * - bills.order_type (dine_in | takeaway), deducido de table_id en datos existentes.
 * - bills.date pasa a timestamptz. Los valores previos se guardaban como hora local
 *   de El Salvador sin zona, así se interpretan al convertir.
 * - bill_details.unit_price: precio al momento de la venta (backfill con el precio actual).
 */
export class CashRegistersAndBillModel1790918736239 implements MigrationInterface {
    name = 'CashRegistersAndBillModel1790918736239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cash_registers" ("cash_register_id" SERIAL NOT NULL, "number" character varying(20) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2bc81b302a480b09e469ed04850" UNIQUE ("number"), CONSTRAINT "PK_b9d04e15dd31693e83461aa3938" PRIMARY KEY ("cash_register_id"))`);

        await queryRunner.query(`ALTER TABLE "bills" DROP CONSTRAINT "FK_0995ca8cc4fb842c6f4b01e4887"`);
        await queryRunner.query(`ALTER TABLE "bills" RENAME COLUMN "cash_register" TO "waiter_id"`);
        await queryRunner.query(`ALTER TABLE "bills" ADD CONSTRAINT "FK_8ff0a65383ad2f1d6c36f93f35e" FOREIGN KEY ("waiter_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "bills" ADD "cash_register_id" integer`);
        await queryRunner.query(`ALTER TABLE "bills" ADD CONSTRAINT "FK_3867754f647125c16ba530b9104" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("cash_register_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "bills" ADD "order_type" character varying(20) NOT NULL DEFAULT 'dine_in'`);
        await queryRunner.query(`UPDATE "bills" SET "order_type" = 'takeaway' WHERE "table_id" IS NULL`);

        await queryRunner.query(`ALTER TABLE "bills" ALTER COLUMN "date" TYPE TIMESTAMP WITH TIME ZONE USING "date" AT TIME ZONE 'America/El_Salvador'`);

        await queryRunner.query(`ALTER TABLE "bill_details" ADD "unit_price" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`UPDATE "bill_details" d SET "unit_price" = CASE WHEN d."quantity" > 0 THEN ROUND(d."sub_total" / d."quantity", 2) ELSE p."price" END FROM "products" p WHERE p."product_id" = d."product_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bill_details" DROP COLUMN "unit_price"`);
        await queryRunner.query(`ALTER TABLE "bills" ALTER COLUMN "date" TYPE TIMESTAMP USING "date" AT TIME ZONE 'America/El_Salvador'`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "order_type"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP CONSTRAINT "FK_3867754f647125c16ba530b9104"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "cash_register_id"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP CONSTRAINT "FK_8ff0a65383ad2f1d6c36f93f35e"`);
        await queryRunner.query(`ALTER TABLE "bills" RENAME COLUMN "waiter_id" TO "cash_register"`);
        await queryRunner.query(`ALTER TABLE "bills" ADD CONSTRAINT "FK_0995ca8cc4fb842c6f4b01e4887" FOREIGN KEY ("cash_register") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP TABLE "cash_registers"`);
    }

}
