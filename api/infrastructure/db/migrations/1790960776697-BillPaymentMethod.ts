import { MigrationInterface, QueryRunner } from "typeorm";

export class BillPaymentMethod1790960776697 implements MigrationInterface {
    name = 'BillPaymentMethod1790960776697'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" ADD "payment_method" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bills" DROP COLUMN "payment_method"`);
    }

}
