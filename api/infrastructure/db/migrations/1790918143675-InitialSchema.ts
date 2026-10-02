import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790918143675 implements MigrationInterface {
    name = 'InitialSchema1790918143675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_types" ("primary_type_id" SERIAL NOT NULL, "name" character varying NOT NULL, "permissionLevel" integer NOT NULL, CONSTRAINT "PK_32b411e5ced1d66e086f89d7dea" PRIMARY KEY ("primary_type_id"))`);
        await queryRunner.query(`CREATE TABLE "consumable_type" ("consumable_type_id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_c46b76af22963a187d532738ae8" PRIMARY KEY ("consumable_type_id"))`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("supplier_id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "phone" character varying(20) NOT NULL, "email" character varying(100) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a2692f796d16e0a30040860112a" PRIMARY KEY ("supplier_id"))`);
        await queryRunner.query(`CREATE TABLE "Consumable" ("consumable_id" SERIAL NOT NULL, "supplier_id" integer NOT NULL, "name" character varying NOT NULL, "consumable_type_id" integer NOT NULL, "quantity" double precision NOT NULL, "unitMeasurement" character varying(20) NOT NULL, "cost" numeric(10,2) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d4b86facd087c4060ba4fd407eb" PRIMARY KEY ("consumable_id"))`);
        await queryRunner.query(`CREATE TABLE "ingredients" ("ingredient_id" SERIAL NOT NULL, "consumable_id" integer NOT NULL, "name" character varying NOT NULL, "quantity" numeric(10,2) NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "PK_ca1733bfdc5be587ed299844ac1" PRIMARY KEY ("ingredient_id"))`);
        await queryRunner.query(`CREATE TABLE "product_types" ("product_type_id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_91a2058eff2209e67033c7378dd" PRIMARY KEY ("product_type_id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("product_id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "cost" numeric(10,2) NOT NULL, "active" boolean NOT NULL, "product_type_id" integer, CONSTRAINT "PK_a8940a4bf3b90bd7ac15c8f4dd9" PRIMARY KEY ("product_id"))`);
        await queryRunner.query(`CREATE TABLE "bill_details" ("bill_details_id" SERIAL NOT NULL, "bill_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL, "sub_total" numeric(10,2) NOT NULL, CONSTRAINT "PK_41a971d797785a5dd96b0f5a6bd" PRIMARY KEY ("bill_details_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tables_status_enum" AS ENUM('disponible', 'ocupada', 'reservada')`);
        await queryRunner.query(`CREATE TABLE "tables" ("table_id" character varying(10) NOT NULL, "zone" character varying(50) NOT NULL, "status" "public"."tables_status_enum" NOT NULL DEFAULT 'disponible', CONSTRAINT "PK_974e210546eb2a1941df31b80af" PRIMARY KEY ("table_id"))`);
        await queryRunner.query(`CREATE TABLE "bills" ("bill_id" SERIAL NOT NULL, "cash_register" integer NOT NULL, "table_id" character varying(10), "customer" character varying NOT NULL, "date" TIMESTAMP NOT NULL, "total" numeric(10,2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b257dee70c4266ec5db78733bf" PRIMARY KEY ("bill_id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" SERIAL NOT NULL, "username" character varying NOT NULL, "type_id" integer NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "active" boolean NOT NULL, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "purchases" ("purchase_id" SERIAL NOT NULL, "date" TIMESTAMP NOT NULL, "cash_register" integer NOT NULL, "supplier_id" integer NOT NULL, "total" numeric(10,2) NOT NULL, CONSTRAINT "PK_b2ebfeff06ca4de4b541e52cf70" PRIMARY KEY ("purchase_id"))`);
        await queryRunner.query(`ALTER TABLE "Consumable" ADD CONSTRAINT "FK_ff626bf9658f2c0cf5b2477f5a7" FOREIGN KEY ("consumable_type_id") REFERENCES "consumable_type"("consumable_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Consumable" ADD CONSTRAINT "FK_7b4ba425e0aef70ecb14e208ebe" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_cf648543467665accd3dab98b34" FOREIGN KEY ("consumable_id") REFERENCES "Consumable"("consumable_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ingredients" ADD CONSTRAINT "FK_a397c54c9cb188d354187b4be26" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9adb63f24f86528856373f0ab9a" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("product_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bill_details" ADD CONSTRAINT "FK_643701a9f93c4d1453361baa6a3" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bill_details" ADD CONSTRAINT "FK_6f20b1d0b535a7d38c7d73fabea" FOREIGN KEY ("bill_id") REFERENCES "bills"("bill_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bills" ADD CONSTRAINT "FK_0995ca8cc4fb842c6f4b01e4887" FOREIGN KEY ("cash_register") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bills" ADD CONSTRAINT "FK_d9e410ab4acd856404380028f7e" FOREIGN KEY ("table_id") REFERENCES "tables"("table_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_4f223be0f78c69ce1d77f385181" FOREIGN KEY ("type_id") REFERENCES "user_types"("primary_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_d5fec047f705d5b510c19379b95" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_d5fec047f705d5b510c19379b95"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_4f223be0f78c69ce1d77f385181"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP CONSTRAINT "FK_d9e410ab4acd856404380028f7e"`);
        await queryRunner.query(`ALTER TABLE "bills" DROP CONSTRAINT "FK_0995ca8cc4fb842c6f4b01e4887"`);
        await queryRunner.query(`ALTER TABLE "bill_details" DROP CONSTRAINT "FK_6f20b1d0b535a7d38c7d73fabea"`);
        await queryRunner.query(`ALTER TABLE "bill_details" DROP CONSTRAINT "FK_643701a9f93c4d1453361baa6a3"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9adb63f24f86528856373f0ab9a"`);
        await queryRunner.query(`ALTER TABLE "ingredients" DROP CONSTRAINT "FK_a397c54c9cb188d354187b4be26"`);
        await queryRunner.query(`ALTER TABLE "ingredients" DROP CONSTRAINT "FK_cf648543467665accd3dab98b34"`);
        await queryRunner.query(`ALTER TABLE "Consumable" DROP CONSTRAINT "FK_7b4ba425e0aef70ecb14e208ebe"`);
        await queryRunner.query(`ALTER TABLE "Consumable" DROP CONSTRAINT "FK_ff626bf9658f2c0cf5b2477f5a7"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "bills"`);
        await queryRunner.query(`DROP TABLE "tables"`);
        await queryRunner.query(`DROP TYPE "public"."tables_status_enum"`);
        await queryRunner.query(`DROP TABLE "bill_details"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_types"`);
        await queryRunner.query(`DROP TABLE "ingredients"`);
        await queryRunner.query(`DROP TABLE "Consumable"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP TABLE "consumable_type"`);
        await queryRunner.query(`DROP TABLE "user_types"`);
    }

}
