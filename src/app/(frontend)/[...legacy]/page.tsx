import { notFound, permanentRedirect } from 'next/navigation'

import { payload } from '@/lib/data'

/**
 * Any address the new site doesn't have lands here. Old WordPress links are sent to their new
 * home with a permanent redirect (keeps shared links and search rankings); everything else is a 404.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ legacy: string[] }> }

export default async function LegacyRedirect({ params }: Props) {
  const parts = (await params).legacy.map((s) => decodeURIComponent(s)).filter(Boolean)
  const path = `/${parts.join('/')}`

  // WordPress archive and feed addresses.
  if (parts[0] === 'category' && parts.at(-1)) {
    const cat = (parts.at(-1) as string).toLowerCase()
    // The importer files WordPress's "Uncategorized" posts under "General".
    permanentRedirect(`/blog/category/${encodeURIComponent(/^uncategori[sz]ed$/.test(cat) ? 'general' : cat)}`)
  }
  if (parts[0] === 'tag' && parts[1]) permanentRedirect(`/blog?q=${encodeURIComponent(parts[1].replace(/-/g, ' '))}`)
  if (parts[0] === 'author' || parts[0] === 'page') permanentRedirect('/blog')
  if (parts.at(-1) === 'feed') permanentRedirect('/rss.xml')
  if (parts[0] === 'wp-admin' || parts[0] === 'wp-login.php') permanentRedirect('/admin')

  // An imported post, matched on the exact old address it had.
  const p = await payload()
  const exact = await p.find({
    collection: 'posts',
    where: { and: [{ legacyPath: { equals: path } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  if (exact.docs[0]?.slug) permanentRedirect(`/blog/${exact.docs[0].slug}`)

  // An old magazine (flip-book) address, set on the issue.
  const issue = await p.find({
    collection: 'issues',
    where: { and: [{ legacyPath: { in: [path, `${path}/`] } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  if (issue.docs[0]?.slug) permanentRedirect(`/magazine/${issue.docs[0].slug}`)

  // Otherwise try the last part of the address as a post slug (covers /2024/05/my-post and /my-post).
  const last = parts.at(-1)
  if (last && /^[a-z0-9-]+$/i.test(last)) {
    const bySlug = await p.find({
      collection: 'posts',
      where: { and: [{ slug: { equals: last.toLowerCase() } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })
    if (bySlug.docs[0]?.slug) permanentRedirect(`/blog/${bySlug.docs[0].slug}`)
  }

  notFound()
}
