import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tv_cache" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"channel_id" varchar,
  	"videos" jsonb,
  	"saved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "youtube_channel" varchar DEFAULT 'https://www.youtube.com/@Giantability';
  ALTER TABLE "site_settings" ADD COLUMN "youtube_channel_id" varchar DEFAULT 'UCTA9_aY4ehU7lkq3nSi2dBw';
  ALTER TABLE "site_settings" ADD COLUMN "tv_on_homepage" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tv_cache" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "youtube_channel";
  ALTER TABLE "site_settings" DROP COLUMN "youtube_channel_id";
  ALTER TABLE "site_settings" DROP COLUMN "tv_on_homepage";`)
}
