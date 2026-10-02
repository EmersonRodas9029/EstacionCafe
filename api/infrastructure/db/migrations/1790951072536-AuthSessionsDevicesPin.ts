import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthSessionsDevicesPin1790951072536 implements MigrationInterface {
    name = 'AuthSessionsDevicesPin1790951072536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("session_id" uuid NOT NULL, "user_id" integer NOT NULL, "device_id" integer, "method" character varying(10) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_9340188c93349808f10d1db74a8" PRIMARY KEY ("session_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_97207844c19e5c27d33a07f67c" ON "sessions" ("device_id") `);
        await queryRunner.query(`CREATE TABLE "devices" ("device_id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "token_hash" character varying(64) NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_seen_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_26e12813565b42b2a5d82ad2a46" UNIQUE ("token_hash"), CONSTRAINT "PK_2667f40edb344d6f274a0d42b6f" PRIMARY KEY ("device_id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "pin_hash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_30bebe4fadb8a7f7fd84443472d" UNIQUE ("pin_hash")`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_30bebe4fadb8a7f7fd84443472d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pin_hash"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97207844c19e5c27d33a07f67c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_085d540d9f418cfbdc7bd55bb1"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
