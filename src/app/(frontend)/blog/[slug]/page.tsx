import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdSlot } from '@/components/site/AdSlot'
import { EyeIcon } from '@/components/site/Icons'
import { PostBody } from '@/components/site/PostBody'
import { PostCard, PostMeta } from '@/components/site/PostCard'
import { ShareButtons } from '@/components/site/ShareButtons'
import { SubscribeForm } from '@/components/site/SubscribeForm'
import { TrackPost } from '@/components/site/TrackView'
import { formatCount, getPostBySlug, getRelatedPosts, mediaUrl, payload } from '@/lib/data'
import { getViewTotals } from '@/lib/views'

export const revalidate = 300

// Posts are rendered on their first visit, then cached; nothing is built ahead of time.
export async function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug)
  if (!post) return {}
  const img = mediaUrl(post.cover, 'hero')
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: 'article', title: post.title, description: post.excerpt, publishedTime: post.publishedAt, images: img ? [img] : [] },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: img ? [img] : [] },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)
  const p = await payload()
  const relViews = await getViewTotals(p, 'post', related.map((r) => r.id))
  const author = typeof post.author === 'object' ? post.author : null
  const cover = typeof post.cover === 'object' ? post.cover : null
  const heroImg = mediaUrl(cover, 'hero')
  const avatar = author ? mediaUrl(author.photo, 'card') : null
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/blog/${post.slug}`

  return (
    <>
      <TrackPost id={post.id} />
      <article>
        <div className="wrap narrow article-head">
          <Link href="/blog" className="text-link" style={{ fontSize: 14, width: 'fit-content' }}>
            ← Back to the blog
          </Link>
          <PostMeta post={post} />
          <h1 className="display" style={{ fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 1 }}>
            {post.title}
          </h1>
          <p className="standfirst" style={{ fontStyle: 'italic', fontSize: 23, maxWidth: 'none' }}>
            {post.excerpt}
          </p>
          <div className="byline">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" aria-hidden="true">
                {avatar && <img src={avatar} alt="" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontWeight: 600 }}>{author?.name ?? 'Giantability'}</span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {author?.role ?? 'Giantability Media Networks'}
                </span>
              </div>
            </div>
            <span className="view-badge">
              <EyeIcon size={18} />
              {formatCount(post.viewCount)} views
            </span>
          </div>
        </div>

        {heroImg && (
          <figure className="wrap" style={{ maxWidth: 1100, margin: '32px auto 0' }}>
            <div className="ph" style={{ aspectRatio: '16 / 8', borderRadius: 12 }}>
              <img src={heroImg} alt={cover?.alt ?? ''} />
            </div>
            {(cover?.caption || cover?.credit) && (
              <figcaption className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                {[cover.caption, cover.credit && `Photo: ${cover.credit}`].filter(Boolean).join(' · ')}
              </figcaption>
            )}
          </figure>
        )}

        <div className="wrap read prose" style={{ paddingTop: 32 }}>
          <PostBody body={post.body} insert={<AdSlot placement="article" />} />
        </div>

        <div className="wrap read" style={{ paddingTop: 8, paddingBottom: 56, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {post.tags && post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          )}
          <ShareButtons url={url} title={post.title} />
          <section aria-labelledby="post-sub-h" className="signup-card">
            <div>
              <h2 id="post-sub-h" className="h-m">
                Enjoyed this? Get the weekly round-up
              </h2>
              <p>New posts from Giantability in your inbox once a week, plus each new magazine issue.</p>
            </div>
            <SubscribeForm source={`post:${post.slug}`} compact />
          </section>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="rel-h" style={{ background: 'var(--soft)' }}>
          <div className="wrap section" style={{ paddingTop: 64 }}>
            <h2 id="rel-h" className="display h-l" style={{ marginBottom: 28 }}>
              Keep reading
            </h2>
            <div className="grid-cards">
              {related.map((r) => (
                <PostCard key={r.id} post={{ ...r, viewCount: relViews.get(String(r.id)) ?? 0 }} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
