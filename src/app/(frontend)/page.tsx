import Link from 'next/link'

import { AdSlot } from '@/components/site/AdSlot'
import { PostCard } from '@/components/site/PostCard'
import { SubscribeForm } from '@/components/site/SubscribeForm'
import { TvStrip } from '@/components/site/TvStrip'
import { formatDate, getIssues, getPosts, getSettings, mediaUrl, payload, type PostWithViews } from '@/lib/data'
import { getViewTotals } from '@/lib/views'

// Cached and refreshed every 5 minutes, or straight away when an editor publishes.
export const revalidate = 300

export default async function HomePage() {
  const [settings, latest, issues] = await Promise.all([getSettings(), getPosts({ limit: 7 }), getIssues()])

  let featured: PostWithViews | undefined
  const pick = settings.featuredPost
  if (pick && typeof pick === 'object' && pick._status === 'published' && Date.parse(pick.publishedAt) <= Date.now()) {
    const p = await payload()
    const views = await getViewTotals(p, 'post', [pick.id])
    featured = { ...pick, viewCount: views.get(String(pick.id)) ?? 0 }
  }
  featured ??= latest.docs[0]
  const rest = latest.docs.filter((d) => d.id !== featured?.id).slice(0, 6)
  const issue = issues[0]
  const heroImg = featured ? mediaUrl(featured.cover, 'hero') : null
  const issueCover = issue ? mediaUrl(issue.cover, 'cover') : null

  return (
    <>
      {featured ? (
        <section aria-labelledby="hero-h" className="wrap hero">
          <div className="hero-copy">
            <div className="meta" style={{ fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              <span className="tag-dark">This week</span>
              <span>
                {formatDate(featured.publishedAt, { weekday: 'short' })}
                {typeof featured.category === 'object' && featured.category ? ` · ${featured.category.name}` : ''}
              </span>
            </div>
            <h1 id="hero-h" className="display h-xl">
              {featured.title}
            </h1>
            <p className="standfirst">{featured.excerpt}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="btn" href={`/blog/${featured.slug}`}>
                Read the story
              </Link>
              <Link className="btn ghost" href="/blog">
                All posts
              </Link>
            </div>
          </div>
          <Link href={`/blog/${featured.slug}`} className="ph" aria-label={`Open: ${featured.title}`}>
            {heroImg && <img src={heroImg} alt="" />}
          </Link>
        </section>
      ) : (
        <section className="wrap hero">
          <div className="hero-copy">
            <h1 className="display h-xl">Giantability Media Networks</h1>
            <p className="standfirst">The first weekly post is on its way.</p>
          </div>
        </section>
      )}

      {settings.cadenceLine && (
        <div className="strip">
          <div className="wrap">
            <span className="display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0 }}>
              {settings.cadenceLine}
            </span>
            <Link href="/blog" className="text-link" style={{ fontWeight: 400 }}>
              Browse the archive →
            </Link>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <section aria-labelledby="latest-h" className="wrap section">
          <div className="section-head">
            <h2 id="latest-h" className="display h-l">
              Latest posts
            </h2>
            <Link href="/blog" className="text-link">
              See all posts →
            </Link>
          </div>
          <div className="grid-cards">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <div className="wrap" style={{ paddingBottom: 56 }}>
        <AdSlot placement="home" />
      </div>

      <TvStrip />

      {issue && (
        <section aria-labelledby="mag-h" className="mag-band">
          <div className="wrap">
            <Link href={`/magazine/${issue.slug}`} className="cover" aria-label={`Read issue ${issue.issueNumber}`}>
              {issueCover && <img src={issueCover} alt="" />}
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <span className="kicker" style={{ color: 'var(--accent-light)' }}>
                The magazine · Issue {issue.issueNumber} · {formatDate(issue.releaseDate, { day: undefined })}
              </span>
              <h2 id="mag-h" className="display h-xl" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1 }}>
                {issue.title}
              </h2>
              {issue.summary && (
                <p className="standfirst" style={{ color: '#D5DCE6', fontSize: 20 }}>
                  {issue.summary}
                </p>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link className="btn light" href={`/magazine/${issue.slug}`}>
                  Read online
                </Link>
                <Link className="btn ghost-light" href="/magazine#archive">
                  Past issues
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="work-h" className="wrap section">
        <h2 id="work-h" className="display h-l" style={{ marginBottom: 36 }}>
          Work with Giantability
        </h2>
        <div className="ways">
          {[
            ['01', 'Partnership', 'Long-term programmes, sponsored series and co-branded events.'],
            ['02', 'Collaboration', 'Guest writing, joint features, interviews and content swaps.'],
            ['03', 'Advertising', 'Display placements on the site and full-page ads in the magazine.'],
          ].map(([n, title, text]) => (
            <Link key={n} href="/partner" className="card">
              <span className="muted" style={{ fontSize: 13, letterSpacing: '0.12em', fontWeight: 600 }}>
                {n}
              </span>
              <h3 className="h-m" style={{ fontSize: 26 }}>
                {title}
              </h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--ink-2)' }}>{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="subscribe" aria-labelledby="sub-h" className="subscribe-band">
        <div className="wrap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
            <h2 id="sub-h" className="display" style={{ fontSize: 36, letterSpacing: '-0.02em' }}>
              Join the mailing list
            </h2>
            <p style={{ margin: 0, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              A weekly round-up of new posts, plus a note when each magazine issue is out. No spam, unsubscribe any time.
            </p>
          </div>
          <SubscribeForm source="homepage" />
        </div>
      </section>
    </>
  )
}

