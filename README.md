# Giantability Media Networks

The website and admin for Giantability Media Networks: a weekly blog, an online magazine reader, a partnerships page, and an admin dashboard with built-in view tracking.

Built with **Next.js** and **Payload CMS** (the admin lives inside the same app at `/admin`), Postgres on **Neon**, files on **Cloudflare R2**, and email through **Resend**. Every service runs on its free plan.

## What's in it

| Page | Address | Notes |
| --- | --- | --- |
| Home | `/` | Featured post (set in Site settings, or the newest), latest posts, current magazine issue, signup |
| Blog | `/blog`, `/blog/category/<slug>` | Category filter, search, pagination, "Most read this month" |
| Post | `/blog/<slug>` | View counter, in-article ad slot, share buttons, related posts |
| Magazine | `/magazine`, `/magazine/<slug>` | PDF reader (two-page spreads on desktop, single pages on phones), contents list, archive |
| Partner with us | `/partner` | Packages per tab, audience figures, enquiry form |
| Admin | `/admin` | Overview dashboard, posts, issues, enquiries, subscribers, settings |

**View tracking** is counted by the site itself (`/api/views` → the `daily_views` table): every page view, every post view, and a magazine read once a visitor turns past the cover. Bots are ignored and repeat views from the same visitor within 30 minutes count once. The admin Overview shows the 14-day chart, views by page and top posts.

**Scheduling:** publish a post or issue with a future date and it stays hidden until that date.

**New-issue emails:** a daily job (`/api/cron/daily`, 08:00 UTC) emails subscribers about a newly released issue, 90 a day, until everyone has had it. Each email has an unsubscribe link.

## Importing posts from WordPress

Admin → **Import from WordPress** (or `/admin/import`, admins only).

Three ways in, all on the same page:

- **From the site's address** (easiest): type the old site's address and click *Find posts*. Published posts are read through WordPress's built-in API (`/wp-json/wp/v2/posts`), 20 at a time. No login or export needed. If a security plugin blocks the API, the page says so.
- **.json files**: open `oldsite.com/wp-json/wp/v2/posts?per_page=100&_embed&page=1` in a browser, save it as a .json file, repeat for `page=2`, `page=3`… and choose all the files together.
- **.xml export**: WordPress **Tools → Export → Posts**. The only route that includes drafts.

Then click **Import**. Posts are brought in one at a time; keep the tab open until it says *Finished*.

What comes across: title, slug, publish date, excerpt (or one made from the text), body (headings, paragraphs, links, lists, quotes), categories (WordPress "Uncategorized" becomes "General"), tags, author, the featured image and images in the text. Images are downloaded from the old site, so it must still be online. Captions stay with their images, YouTube embeds become links. Drafts are optional and arrive as drafts.

Running it again skips posts already imported, and **Retry failed** re-runs only the ones that failed.

Old addresses keep working: `/2024/05/my-post/`, `/category/news/`, `/tag/x/` and `/feed/` are permanently redirected to the new pages (`src/app/(frontend)/[...legacy]`).

## Run it locally

Needs Node 20.18+ and pnpm, plus a Postgres database (a free Neon database works, or local Postgres).

```bash
pnpm install
cp .env.example .env      # fill DATABASE_URL, PAYLOAD_SECRET, NEXT_PUBLIC_SITE_URL=http://localhost:3000
pnpm dev                  # http://localhost:3000
```

Open `http://localhost:3000/admin` and create the first admin user. Without R2 settings, uploads are stored in the `media/` folder.

## Deploy (all free plans)

1. **Neon** – create a project; copy the pooled connection string into `DATABASE_URL`.
2. **Cloudflare R2** – create a bucket, turn on public access (r2.dev or a custom domain like `media.giantability.com`), and create an API token with Object Read & Write on the bucket. Add a CORS rule so the admin can upload files straight to R2 (PUT) and the magazine reader can load PDFs (GET):
   ```json
   [{ "AllowedOrigins": ["https://giantability-web.vercel.app", "https://giantability.com"], "AllowedMethods": ["GET", "HEAD", "PUT"], "AllowedHeaders": ["*"] }]
   ```
3. **Resend** – verify the sending domain and create an API key.
4. **Vercel** – import this repo, add every variable from `.env.example`, deploy. On the first start the database tables are created (`src/migrations`) and the starting content is added: the five blog categories and the Partner page wording (`src/lib/defaults.ts`). The daily job is set in `vercel.json`.
5. Open `/admin` and create the first admin user.

### About Vercel Hobby

Vercel's Hobby plan is for non-commercial use, and it allows one scheduled job a day (which is all this site uses). Nothing in the code is tied to Vercel: the same repo deploys to Netlify's free plan (add the daily job as a Netlify scheduled function calling `/api/cron/daily` with the `Authorization: Bearer <CRON_SECRET>` header).

## Regenerating the admin import map

Run it with the R2 variables set (any values), so the direct-to-R2 upload handler stays in the map:

```bash
R2_BUCKET=x R2_ACCESS_KEY_ID=x R2_SECRET_ACCESS_KEY=x R2_ACCOUNT_ID=x pnpm generate:importmap
```

## Making changes to the content model

Edit the collections in `src/collections`, then:

```bash
export R2_BUCKET=x R2_ACCESS_KEY_ID=x R2_SECRET_ACCESS_KEY=x R2_ACCOUNT_ID=x   # storage on, as in production
pnpm generate:types
pnpm payload migrate:create <short-name>   # commit the new file in src/migrations
```

Always generate with the R2 variables set: the storage adapter adds a column to `media`, and a migration made without it would leave production out of step.

Production applies new migrations automatically on the next start.

## Staying inside the free limits

- Pages are cached and refreshed every 5 minutes or as soon as an editor publishes.
- Images are resized once on upload (`card`, `hero`, `cover`) and served from R2, so Vercel never transfers them.
- Export magazine PDFs for screen (about 150 dpi), ideally under 40 MB.
- Emails go out in daily batches below Resend's 100-a-day free limit.

## Project layout

```
src/
  app/(frontend)/      public pages, forms (actions.ts), /api/views, /api/cron/daily, RSS
  app/(payload)/       the admin (generated by Payload)
  collections/         Posts, Issues, Categories, Authors, Media, Enquiries, Subscribers, Users, DailyViews
  globals/             Site settings (homepage feature, Partner page, ad slots, social links)
  components/site/     header, footer, cards, magazine reader, forms
  components/admin/    admin Overview dashboard and logo
  lib/                 data queries, view counting, email
  migrations/          database migrations applied in production
```
