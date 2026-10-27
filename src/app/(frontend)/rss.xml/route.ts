import { getPosts } from '@/lib/data'

export const revalidate = 3600

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string)

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const { docs } = await getPosts({ limit: 30 })
  const items = docs
    .map(
      (p) => `<item>
  <title>${esc(p.title)}</title>
  <link>${site}/blog/${p.slug}</link>
  <guid>${site}/blog/${p.slug}</guid>
  <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
  <description>${esc(p.excerpt)}</description>
</item>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Giantability Media Network</title>
  <link>${site}</link>
  <description>New posts every week from Giantability Media Network.</description>
  <language>en</language>
${items}
</channel>
</rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
