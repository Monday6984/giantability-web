import config from '@payload-config'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Category, Issue, Media, Post, SiteSetting } from '@/payload-types'

import { getTopViewed, getViewTotals } from './views'

export const payload = cache(() => getPayload({ config }))

const nowIso = () => new Date().toISOString()

/** Only published posts whose publish date has arrived (a future date = scheduled). */
const livePosts = (): Where => ({
  and: [{ _status: { equals: 'published' } }, { publishedAt: { less_than_equal: nowIso() } }],
})
const liveIssues = (): Where => ({
  and: [{ _status: { equals: 'published' } }, { releaseDate: { less_than_equal: nowIso() } }],
})

/** viewCount is null when the count is below Site settings → View counts (so nothing is shown). */
export type PostWithViews = Post & { viewCount: number | null }

/** Views on this site plus any carried over from the old website, or null if under the display minimum. */
export async function publicCount(counted: number, earlier?: number | null) {
  const total = counted + Math.max(0, earlier ?? 0)
  const min = (await getSettings()).minViewsShown ?? 0
  return total >= min ? total : null
}

export async function withViews(posts: Post[]): Promise<PostWithViews[]> {
  const p = await payload()
  const totals = await getViewTotals(p, 'post', posts.map((x) => x.id))
  return Promise.all(posts.map(async (x) => ({ ...x, viewCount: await publicCount(totals.get(String(x.id)) ?? 0, x.earlierViews) })))
}

export async function getPosts(opts: { page?: number; limit?: number; category?: Category; q?: string } = {}) {
  const p = await payload()
  const and: Where[] = [livePosts()]
  if (opts.category) and.push({ category: { equals: opts.category.id } })
  if (opts.q) and.push({ or: [{ title: { like: opts.q } }, { excerpt: { like: opts.q } }] })
  const res = await p.find({
    collection: 'posts',
    where: { and },
    sort: '-publishedAt',
    limit: opts.limit ?? 10,
    page: opts.page ?? 1,
    depth: 1,
    overrideAccess: false,
  })
  return { ...res, docs: await withViews(res.docs) }
}

export async function getPostBySlug(slug: string) {
  const p = await payload()
  const res = await p.find({
    collection: 'posts',
    where: { and: [livePosts(), { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  const post = res.docs[0]
  if (!post) return null
  return (await withViews([post]))[0]
}

export async function getRelatedPosts(post: Post, limit = 3) {
  const p = await payload()
  const categoryId = typeof post.category === 'object' ? post.category?.id : post.category
  const res = await p.find({
    collection: 'posts',
    where: { and: [livePosts(), { id: { not_equals: post.id } }, { category: { equals: categoryId } }] },
    sort: '-publishedAt',
    limit,
    depth: 1,
    overrideAccess: false,
  })
  if (res.docs.length >= limit) return res.docs
  const more = await p.find({
    collection: 'posts',
    where: { and: [livePosts(), { id: { not_in: [post.id, ...res.docs.map((d) => d.id)] } }] },
    sort: '-publishedAt',
    limit: limit - res.docs.length,
    depth: 1,
    overrideAccess: false,
  })
  return [...res.docs, ...more.docs]
}

export async function getMostRead(limit = 5) {
  const p = await payload()
  const top = await getTopViewed(p, 'post', 30, limit * 2)
  if (!top.length) return []
  const res = await p.find({
    collection: 'posts',
    where: { and: [livePosts(), { id: { in: top.map((t) => t.docId) } }] },
    limit: top.length,
    depth: 0,
    overrideAccess: false,
  })
  const byId = new Map(res.docs.map((d) => [String(d.id), d]))
  const min = (await getSettings()).minViewsShown ?? 0
  return top
    .map((t) => ({ post: byId.get(t.docId), views: t.total >= min ? t.total : null }))
    .filter((x): x is { post: Post; views: number | null } => Boolean(x.post))
    .slice(0, limit)
}

export async function getCategories() {
  const p = await payload()
  const res = await p.find({ collection: 'categories', sort: 'name', limit: 50, depth: 0 })
  return res.docs
}

export async function getCategoryBySlug(slug: string) {
  const p = await payload()
  const res = await p.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  return res.docs[0] ?? null
}

export async function getIssues() {
  const p = await payload()
  const res = await p.find({
    collection: 'issues',
    where: liveIssues(),
    sort: '-releaseDate',
    limit: 100,
    depth: 1,
    overrideAccess: false,
  })
  return res.docs
}

export async function getIssueBySlug(slug: string) {
  const p = await payload()
  const res = await p.find({
    collection: 'issues',
    where: { and: [liveIssues(), { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}

/** Reads per issue as shown on the site (old-site reads included; null = below the display minimum). */
export async function getIssueReads(issues: Issue[]) {
  const p = await payload()
  const counted = await getViewTotals(p, 'issue', issues.map((i) => i.id))
  const out = new Map<string, number | null>()
  for (const i of issues) out.set(String(i.id), await publicCount(counted.get(String(i.id)) ?? 0, i.earlierViews))
  return out
}

/** The next scheduled issue, so the archive can say when it's coming. */
export async function getNextIssueDate() {
  const p = await payload()
  const res = await p.find({
    collection: 'issues',
    where: { and: [{ _status: { equals: 'published' } }, { releaseDate: { greater_than: nowIso() } }] },
    sort: 'releaseDate',
    limit: 1,
    depth: 0,
  })
  return res.docs[0]?.releaseDate ?? null
}

// Once per request, however many components ask.
export const getSettings = cache(async (): Promise<SiteSetting> => {
  const p = await payload()
  return p.findGlobal({ slug: 'site-settings', depth: 1 })
})

/** Ads running now for a placement. The end date counts as a full day. */
export async function getActiveAds(placement: 'home' | 'article') {
  const settings = await getSettings()
  const now = Date.now()
  return (settings.ads ?? []).filter(
    (ad) =>
      ad.active &&
      ad.placement === placement &&
      (!ad.startDate || Date.parse(ad.startDate) <= now) &&
      (!ad.endDate || Date.parse(ad.endDate) + 864e5 > now),
  )
}

/** Picks the best stored size of an image, falling back to the original. */
export const mediaUrl = (media: number | Media | null | undefined, size?: 'card' | 'hero' | 'cover') => {
  if (!media || typeof media !== 'object') return null
  return (size && media.sizes?.[size]?.url) || media.url || null
}

export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) =>
  iso
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos', ...opts }).format(
        new Date(iso),
      )
    : ''

export const formatCount = (n: number) => n.toLocaleString('en-GB')
