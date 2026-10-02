import { MigrationInterface, QueryRunner } from "typeorm";

export class UserTypeRole1790918396182 implements MigrationInterface {
    name = 'UserTypeRole1790918396182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_types" ADD "role" character varying(20) NOT NULL DEFAULT 'mesero'`);
        // Datos existentes: deducir el rol desde el nombre del tipo
        await queryRunner.query(`UPDATE "user_types" SET "role" = 'admin' WHERE "name" ILIKE 'admin%'`);
        await queryRunner.query(`UPDATE "user_types" SET "role" = 'cajero' WHERE "name" ILIKE 'cajer%'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_types" DROP COLUMN "role"`);
    }

}
