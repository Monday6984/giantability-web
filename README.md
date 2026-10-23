# Giantability Media Networks

The website and admin for Giantability Media Networks: a weekly blog, an online magazine reader, a partnerships page, and an admin dashboard with built-in view tracking.

Built with **Next.js** and **Payload CMS** (the admin lives inside the same app at `/admin`), Postgres on **Neon**, files on **Cloudflare R2**, and email through **Resend**. Every service runs on its free plan.

## What's in it

| Page | Address | Notes |
| --- | --- | --- |
| Home | `/` | Featured post (set in Site settings, or the newest), latest posts, current magazine issue, signup |
| Blog | `/blog`, `/blog/category/<slug>` | Category filter, search, pagination, "Most read this month" |
| Post | `/blog/<slug>` | View counter, in-article ad slot, share buttons, related posts |
| Magazine | `/magazine`, `/magazine/<slug>` | 3D flip-book reader with page-turn sound (two-page spreads on desktop, single pages on phones), contents list, archive |
| Partner with us | `/partner` | Packages per tab, audience figures, enquiry form |
| Admin | `/admin` | Overview dashboard, posts, issues, enquiries, subscribers, settings |

**Magazine reader:** the issue PDF is drawn page by page into a flip book ([StPageFlip](https://github.com/Nodlik/StPageFlip), MIT). Next/Prev, a click on a page, dragging a corner, swiping and the arrow keys all turn pages, with a paper sound (`public/sounds/page-flip.mp3`, original and free to use; replace the file to change it) that readers can mute. PDFs laid out as two-page spreads are cut into single pages automatically. Zooming switches to a scrollable view of the current pages, and visitors who have reduced motion turned on get a fade instead of the page curl.

**View tracking** is counted by the site itself (`/api/views` → the `daily_views` table): every page view, every post view, and a magazine read once a visitor turns past the cover. Bots are ignored and repeat views from the same visitor within 30 minutes count once. The admin Overview shows the 14-day chart, views by page and top posts.

**Scheduling:** publish a post or issue with a future date and it stays hidden until that date.

**Mailing list:** signups on the homepage, after every post and in the footer. Subscribers get a weekly round-up of new posts (at most one email a week each) and a note when a magazine issue is released. The daily job (`/api/cron/daily`, 08:00 UTC) sends both within one daily allowance (`DAILY_EMAIL_LIMIT`, default 90, under Resend's free 100/day), so about 600 subscribers fit on the free plan. Nothing is sent, or marked as sent, until `RESEND_API_KEY` is set. Admin → Subscribers has **Download list (CSV)** and **Preview the weekly email**; the round-up can be switched off in Site settings → Mailing list.

**Adverts:** Site settings → Ad slots. Homepage banner 1940 × 500 px, in-post banner 1456 × 180 px (placed after the third paragraph), optional phone version 600 × 500 px. Several running ads in one place take turns. When none is running, GMN's own "Advertise with us" banner shows.

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
