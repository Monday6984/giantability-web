import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "earlier_views" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_earlier_views" numeric;
  ALTER TABLE "issues" ADD COLUMN "earlier_views" numeric;
  ALTER TABLE "issues" ADD COLUMN "legacy_path" varchar;
  ALTER TABLE "_issues_v" ADD COLUMN "version_earlier_views" numeric;
  ALTER TABLE "_issues_v" ADD COLUMN "version_legacy_path" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "min_views_shown" numeric DEFAULT 50;
  CREATE INDEX "issues_legacy_path_idx" ON "issues" USING btree ("legacy_path");
  CREATE INDEX "_issues_v_version_version_legacy_path_idx" ON "_issues_v" USING btree ("version_legacy_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "issues_legacy_path_idx";
  DROP INDEX "_issues_v_version_version_legacy_path_idx";
  ALTER TABLE "posts" DROP COLUMN "earlier_views";
  ALTER TABLE "_posts_v" DROP COLUMN "version_earlier_views";
  ALTER TABLE "issues" DROP COLUMN "earlier_views";
  ALTER TABLE "issues" DROP COLUMN "legacy_path";
  ALTER TABLE "_issues_v" DROP COLUMN "version_earlier_views";
  ALTER TABLE "_issues_v" DROP COLUMN "version_legacy_path";
  ALTER TABLE "site_settings" DROP COLUMN "min_views_shown";`)
}
