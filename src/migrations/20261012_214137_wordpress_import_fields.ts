import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "legacy_path" varchar;
  ALTER TABLE "posts" ADD COLUMN "wp_id" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_legacy_path" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_wp_id" varchar;
  ALTER TABLE "media" ADD COLUMN "source_url" varchar;
  CREATE INDEX "posts_legacy_path_idx" ON "posts" USING btree ("legacy_path");
  CREATE INDEX "posts_wp_id_idx" ON "posts" USING btree ("wp_id");
  CREATE INDEX "_posts_v_version_version_legacy_path_idx" ON "_posts_v" USING btree ("version_legacy_path");
  CREATE INDEX "_posts_v_version_version_wp_id_idx" ON "_posts_v" USING btree ("version_wp_id");
  CREATE INDEX "media_source_url_idx" ON "media" USING btree ("source_url");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "posts_legacy_path_idx";
  DROP INDEX "posts_wp_id_idx";
  DROP INDEX "_posts_v_version_version_legacy_path_idx";
  DROP INDEX "_posts_v_version_version_wp_id_idx";
  DROP INDEX "media_source_url_idx";
  ALTER TABLE "posts" DROP COLUMN "legacy_path";
  ALTER TABLE "posts" DROP COLUMN "wp_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_legacy_path";
  ALTER TABLE "_posts_v" DROP COLUMN "version_wp_id";
  ALTER TABLE "media" DROP COLUMN "source_url";`)
}
