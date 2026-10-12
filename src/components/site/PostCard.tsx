import Link from 'next/link'

import { formatCount, formatDate, mediaUrl, type PostWithViews } from '@/lib/data'

import { EyeIcon } from './Icons'

const catName = (post: PostWithViews) => (typeof post.category === 'object' ? post.category?.name : '')

export function PostMeta({ post }: { post: PostWithViews }) {
  return (
    <div className="meta">
      <span className="cat">{catName(post)}</span>
      <span>{formatDate(post.publishedAt)}</span>
      {post.readingTime ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min read</span>
        </>
      ) : null}
    </div>
  )
}

export function Views({ count }: { count: number }) {
  return (
    <span className="views">
      <EyeIcon />
      {formatCount(count)} {count === 1 ? 'view' : 'views'}
    </span>
  )
}

export function PostCard({ post }: { post: PostWithViews }) {
  const img = mediaUrl(post.cover, 'card')
  const alt = typeof post.cover === 'object' ? (post.cover?.alt ?? '') : ''
  return (
    <Link className="card" href={`/blog/${post.slug}`}>
      <div className="ph">{img && <img src={img} alt={alt} loading="lazy" />}</div>
      <PostMeta post={post} />
      <h3 className="h-m">{post.title}</h3>
      <Views count={post.viewCount} />
    </Link>
  )
}

export function PostRow({ post }: { post: PostWithViews }) {
  const img = mediaUrl(post.cover, 'card')
  const alt = typeof post.cover === 'object' ? (post.cover?.alt ?? '') : ''
  return (
    <Link className="row" href={`/blog/${post.slug}`}>
      <div className="ph">{img && <img src={img} alt={alt} loading="lazy" />}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <PostMeta post={post} />
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <Views count={post.viewCount} />
      </div>
    </Link>
  )
}
