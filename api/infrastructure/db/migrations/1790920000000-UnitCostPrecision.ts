import { MigrationInterface, QueryRunner } from "typeorm";

/** Costos por gramo/mililitro necesitan más de 2 decimales. */
export class UnitCostPrecision1790920000000 implements MigrationInterface {
    name = 'UnitCostPrecision1790920000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Consumable" ALTER COLUMN "cost" TYPE numeric(12,4)`);
        await queryRunner.query(`ALTER TABLE "purchase_details" ALTER COLUMN "unit_cost" TYPE numeric(12,4)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_details" ALTER COLUMN "unit_cost" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "Consumable" ALTER COLUMN "cost" TYPE numeric(10,2)`);
    }
}
