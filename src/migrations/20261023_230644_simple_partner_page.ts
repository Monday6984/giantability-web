import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_ways_packages" CASCADE;
  DROP TABLE "site_settings_texts" CASCADE;
  ALTER TABLE "enquiries" DROP COLUMN "budget";`)

  // Swap the original card wording for the new short lines, unless the client has already rewritten it.
  await db.execute(sql`
  UPDATE "site_settings_ways" SET "blurb" = 'Long-term, co-branded work for organisations that want a lasting presence with our readers.'
    WHERE "blurb" = 'Ongoing, co-branded work for organisations that want a sustained presence with our readers.';
  UPDATE "site_settings_ways" SET "blurb" = 'Creative projects with writers, creators, brands and fellow media.'
    WHERE "blurb" LIKE 'Creative work with writers, creators, brands and other media%';
  UPDATE "site_settings_ways" SET "blurb" = 'Put your brand in front of our readers, on the website and in the magazine.'
    WHERE "blurb" = 'Paid placements on the website and inside the magazine.';
  UPDATE "site_settings_ways" SET "blurb" = left("blurb", 180) WHERE length("blurb") > 180;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_ways_packages" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"price" varchar
  );
  
  CREATE TABLE "site_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "enquiries" ADD COLUMN "budget" varchar;
  ALTER TABLE "site_settings_ways_packages" ADD CONSTRAINT "site_settings_ways_packages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_ways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_texts" ADD CONSTRAINT "site_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_ways_packages_order_idx" ON "site_settings_ways_packages" USING btree ("_order");
  CREATE INDEX "site_settings_ways_packages_parent_id_idx" ON "site_settings_ways_packages" USING btree ("_parent_id");
  CREATE INDEX "site_settings_texts_order_parent" ON "site_settings_texts" USING btree ("order","parent_id");`)
}
