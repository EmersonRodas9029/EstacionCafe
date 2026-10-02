import { MigrationInterface, QueryRunner } from "typeorm";
import { readFileSync } from "fs";
import { resolve } from "path";

export class CreateInitialSchema1761710200000 implements MigrationInterface {
  name = "CreateInitialSchema1761710200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schemaPath = resolve(process.cwd(), "supabase_database.sql.txt");
    const schema = readFileSync(schemaPath, "utf8")
      .replace(/^\s*BEGIN;\s*/i, "")
      .replace(/\s*COMMIT;\s*$/i, "");

    await queryRunner.query(schema);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS bills_set_updated_at ON public.bills;
      DROP FUNCTION IF EXISTS public.set_updated_at();
      DROP TABLE IF EXISTS public.purchases;
      DROP TABLE IF EXISTS public.bill_details;
      DROP TABLE IF EXISTS public.bills;
      DROP TABLE IF EXISTS public.ingredients;
      DROP TABLE IF EXISTS public."Consumable";
      DROP TABLE IF EXISTS public.products;
      DROP TABLE IF EXISTS public.users;
      DROP TABLE IF EXISTS public.tables;
      DROP TABLE IF EXISTS public.user_types;
      DROP TABLE IF EXISTS public.product_types;
      DROP TABLE IF EXISTS public.suppliers;
      DROP TABLE IF EXISTS public.consumable_type;
    `);
  }
}
