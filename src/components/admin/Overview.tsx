import config from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import {
  getDailySeries,
  getTopViewed,
  getViewTotals,
  getViewsInPeriod,
} from '@/lib/views'

const fmt = (n: number) => n.toLocaleString('en-GB')

const change = (now: number, before: number) => {
  if (!before) return now ? 'New this period' : 'No views yet'
  const pct = Math.round(((now - before) / before) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% vs previous 30 days`
}

const card: React.CSSProperties = {
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-100)',
  borderRadius: 12,
  padding: 20,
  minWidth: 0,
}
const label: React.CSSProperties = { fontSize: 13, color: 'var(--theme-elevation-600)', margin: 0 }
const big: React.CSSProperties = { fontSize: 32, fontWeight: 700, margin: '6px 0 4px', letterSpacing: '-0.02em' }
const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--theme-elevation-600)',
  padding: '8px 10px',
  borderBottom: '1px solid var(--theme-elevation-150)',
}
const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--theme-elevation-100)', fontSize: 14 }

const dayLabel = (iso: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${Number(iso.slice(8))} ${months.at(Number(iso.slice(5, 7)) - 1)}`
}

/** The admin home page: views, top posts, magazine reads and new enquiries, all from the site's own data. */
export async function Overview() {
  const payload = await getPayload({ config })

  const [pageViews, pageViewsPrev, postViews, postViewsPrev, series, topPages, topPostIds, newEnquiries, latestIssue] =
    await Promise.all([
      getViewsInPeriod(payload, 'page', 30),
      getViewsInPeriod(payload, 'page', 30, 30),
      getViewsInPeriod(payload, 'post', 30),
      getViewsInPeriod(payload, 'post', 30, 30),
      getDailySeries(payload, 'page', 14),
      getTopViewed(payload, 'page', 30, 8),
      getTopViewed(payload, 'post', 30, 6),
      payload.count({ collection: 'enquiries', where: { status: { equals: 'new' } } }),
      payload.find({
        collection: 'issues',
        where: { and: [{ _status: { equals: 'published' } }, { releaseDate: { less_than_equal: new Date().toISOString() } }] },
        sort: '-releaseDate',
        limit: 1,
        depth: 0,
      }),
    ])

  const issue = latestIssue.docs[0]
  const issueReads = issue ? ((await getViewTotals(payload, 'issue', [issue.id])).get(String(issue.id)) ?? 0) : 0

  const posts = topPostIds.length
    ? await payload.find({
        collection: 'posts',
        where: { id: { in: topPostIds.map((p) => p.docId) } },
        depth: 0,
        limit: topPostIds.length,
        draft: false,
      })
    : { docs: [] }
  const titleById = new Map(posts.docs.map((p) => [String(p.id), p]))

  const max = Math.max(1, ...series.map((d) => d.value))
  const pageMax = Math.max(1, ...topPages.map((p) => p.total))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>Overview</h2>
        <span style={label}>Counted by the site · last 30 days unless noted</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={card}>
          <p style={label}>Page views</p>
          <p style={big}>{fmt(pageViews)}</p>
          <p style={label}>{change(pageViews, pageViewsPrev)}</p>
        </div>
        <div style={card}>
          <p style={label}>Post views</p>
          <p style={big}>{fmt(postViews)}</p>
          <p style={label}>{change(postViews, postViewsPrev)}</p>
        </div>
        <div style={card}>
          <p style={label}>Magazine reads · current issue</p>
          <p style={big}>{fmt(issueReads)}</p>
          <p style={label}>{issue ? `Issue ${issue.issueNumber}: ${issue.title}` : 'No issue released yet'}</p>
        </div>
        <a href="/admin/collections/enquiries?where[status][equals]=new" style={{ ...card, textDecoration: 'none', color: 'inherit' }}>
          <p style={label}>New enquiries</p>
          <p style={big}>{fmt(newEnquiries.totalDocs)}</p>
          <p style={label}>Open the inbox →</p>
        </a>
      </div>

      <div style={card}>
        <p style={{ ...label, marginBottom: 14, fontWeight: 600, color: 'var(--theme-text)', fontSize: 15 }}>
          Page views · last 14 days
        </p>
        <div
          role="img"
          aria-label={`Daily page views for the last 14 days, highest ${fmt(max)}`}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 6, alignItems: 'end', height: 180, borderBottom: '1px solid var(--theme-elevation-150)' }}
        >
          {series.map((d, i) => (
            <div
              key={d.day}
              title={`${dayLabel(d.day)}: ${fmt(d.value)} views`}
              style={{
                height: `${Math.max(2, (d.value / max) * 100)}%`,
                background: i === series.length - 1 ? '#C4321A' : 'var(--theme-elevation-800)',
                borderRadius: '4px 4px 0 0',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
          {series.map((d) => (
            <span key={d.day} style={{ fontSize: 11, textAlign: 'center', color: 'var(--theme-elevation-600)' }}>
              {Number(d.day.slice(8))}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div style={card}>
          <p style={{ ...label, fontWeight: 600, color: 'var(--theme-text)', fontSize: 15, marginBottom: 8 }}>Views by page</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Page</th>
                  <th style={{ ...th, textAlign: 'right' }}>Views</th>
                  <th style={{ ...th, width: '35%' }}>
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Share</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPages.length === 0 && (
                  <tr>
                    <td style={td} colSpan={3}>No page views recorded yet.</td>
                  </tr>
                )}
                {topPages.map((p) => (
                  <tr key={p.docId}>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 13 }}>{p.docId}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(p.total)}</td>
                    <td style={td}>
                      <div aria-hidden="true" style={{ height: 8, background: 'var(--theme-elevation-100)', borderRadius: 4 }}>
                        <div style={{ height: 8, width: `${(p.total / pageMax) * 100}%`, background: '#0E1B2C', borderRadius: 4 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={card}>
          <p style={{ ...label, fontWeight: 600, color: 'var(--theme-text)', fontSize: 15, marginBottom: 8 }}>Top posts</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Post</th>
                  <th style={{ ...th, textAlign: 'right' }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {topPostIds.length === 0 && (
                  <tr>
                    <td style={td} colSpan={2}>No post views recorded yet.</td>
                  </tr>
                )}
                {topPostIds.map((p) => {
                  const post = titleById.get(p.docId)
                  return (
                    <tr key={p.docId}>
                      <td style={td}>
                        {post ? <a href={`/admin/collections/posts/${post.id}`}>{post.title}</a> : 'Deleted post'}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(p.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a className="btn btn--style-primary btn--size-medium" href="/admin/collections/posts/create">+ New post</a>
        <a className="btn btn--style-secondary btn--size-medium" href="/admin/collections/issues/create">Upload magazine issue</a>
        <a className="btn btn--style-secondary btn--size-medium" href="/admin/import">Import from WordPress</a>
        <a className="btn btn--style-secondary btn--size-medium" href="/" target="_blank" rel="noreferrer">View site</a>
      </div>
    </div>
  )
}
