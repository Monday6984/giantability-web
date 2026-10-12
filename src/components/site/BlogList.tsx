import Link from 'next/link'

import { getCategories, getMostRead, getPosts } from '@/lib/data'
import type { Category } from '@/payload-types'

import { PostRow } from './PostCard'

/** The blog index, optionally narrowed to one category; shared by /blog and /blog/category/[slug]. */
export async function BlogList({ category, page, q }: { category?: Category; page: number; q?: string }) {
  const [categories, posts, mostRead] = await Promise.all([
    getCategories(),
    getPosts({ category, page, q, limit: 10 }),
    getMostRead(5),
  ])
  const base = category ? `/blog/category/${category.slug}` : '/blog'
  const pageHref = (n: number) => {
    const params = new URLSearchParams()
    if (n > 1) params.set('page', String(n))
    if (q) params.set('q', q)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  return (
    <>
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span className="kicker">New every week</span>
        <h1 className="display h-xxl">{category ? category.name : 'The Blog'}</h1>
        <div className="filters">
          <nav aria-label="Categories" className="pills">
            <Link className="pill" href="/blog" aria-current={!category ? 'page' : undefined}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                className="pill"
                href={`/blog/category/${c.slug}`}
                aria-current={category?.id === c.id ? 'page' : undefined}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <form role="search" action={base} className="search">
            <label htmlFor="blog-q" className="sr-only">
              Search posts
            </label>
            <input id="blog-q" name="q" type="search" placeholder="Search posts" defaultValue={q} />
            <button type="submit" className="btn">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="wrap with-aside">
        <section aria-label="Posts" className="main-col">
          {q && (
            <p className="muted" style={{ marginTop: 0 }}>
              {posts.totalDocs} {posts.totalDocs === 1 ? 'result' : 'results'} for “{q}” ·{' '}
              <Link href={base}>clear search</Link>
            </p>
          )}
          {posts.docs.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
          {posts.docs.length === 0 && (
            <p style={{ padding: '40px 0', borderTop: '1px solid var(--line)', color: 'var(--muted)', fontSize: 17 }}>
              No posts here yet.
            </p>
          )}
          {posts.totalPages > 1 && (
            <nav aria-label="Pagination" className="pagination">
              {posts.hasPrevPage && posts.prevPage && (
                <Link className="pill" href={pageHref(posts.prevPage)}>
                  ← Newer
                </Link>
              )}
              {Array.from({ length: posts.totalPages }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - (posts.page ?? 1)) <= 2 || n === 1 || n === posts.totalPages)
                .map((n) => (
                  <Link key={n} className="pill" href={pageHref(n)} aria-current={n === posts.page ? 'page' : undefined}>
                    {n}
                  </Link>
                ))}
              {posts.hasNextPage && posts.nextPage && (
                <Link className="pill" href={pageHref(posts.nextPage)}>
                  Older →
                </Link>
              )}
            </nav>
          )}
        </section>

        {mostRead.length > 0 && (
          <aside aria-labelledby="most-h" className="panel">
            <h2 id="most-h" className="h-m" style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
              Most read this month
            </h2>
            <ol className="ranked">
              {mostRead.map(({ post, views }, i) => (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`}>
                    <span className="n">{i + 1}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{post.title}</span>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {views.toLocaleString('en-GB')} views
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </>
  )
}
