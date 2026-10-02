import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsumableMinStock1790919136112 implements MigrationInterface {
    name = 'ConsumableMinStock1790919136112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Consumable" ADD "min_stock" double precision NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Consumable" DROP COLUMN "min_stock"`);
    }

}
