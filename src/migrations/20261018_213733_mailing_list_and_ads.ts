import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscribers" ADD COLUMN "last_digest_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings_ads" ADD COLUMN "mobile_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "weekly_digest" boolean DEFAULT true;
  ALTER TABLE "site_settings_ads" ADD CONSTRAINT "site_settings_ads_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "subscribers_last_digest_at_idx" ON "subscribers" USING btree ("last_digest_at");
  CREATE INDEX "site_settings_ads_mobile_image_idx" ON "site_settings_ads" USING btree ("mobile_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_ads" DROP CONSTRAINT "site_settings_ads_mobile_image_id_media_id_fk";
  
  DROP INDEX "subscribers_last_digest_at_idx";
  DROP INDEX "site_settings_ads_mobile_image_idx";
  ALTER TABLE "subscribers" DROP COLUMN "last_digest_at";
  ALTER TABLE "site_settings_ads" DROP COLUMN "mobile_image_id";
  ALTER TABLE "site_settings" DROP COLUMN "weekly_digest";`)
}
