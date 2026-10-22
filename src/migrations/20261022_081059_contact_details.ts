import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"label" varchar
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "site_settings_phones" ADD CONSTRAINT "site_settings_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_phones_order_idx" ON "site_settings_phones" USING btree ("_order");
  CREATE INDEX "site_settings_phones_parent_id_idx" ON "site_settings_phones" USING btree ("_parent_id");`)

  // Fill in GMN's contact details on the existing settings (editable later in Site settings → Contact & social).
  await db.execute(sql`
  UPDATE "site_settings" SET "contact_email" = 'info@giantability.com' WHERE "contact_email" IS NULL;
  INSERT INTO "site_settings_phones" ("_order", "_parent_id", "id", "number", "label")
  SELECT p.ord, s.id, substr(md5(random()::text || p.ord), 1, 24), p.num, p.lbl
  FROM "site_settings" s
  CROSS JOIN (VALUES (1, '+1 317 937 9676', 'USA'), (2, '+234 913 061 6867', 'Nigeria')) AS p(ord, num, lbl)
  WHERE NOT EXISTS (SELECT 1 FROM "site_settings_phones" x WHERE x."_parent_id" = s.id);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_phones" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "contact_email";`)
}
