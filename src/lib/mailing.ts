/**
 * The mailing list's daily run (called by /api/cron/daily).
 *
 * Two kinds of email share one daily allowance (Resend's free plan: 100 a day, 3,000 a month):
 *  1. New magazine issue: sent to everyone once, oldest subscribers first, until all have it.
 *  2. Weekly round-up: each subscriber gets at most one every 7 days, listing posts published
 *     since their last one. Subscribers are spread across the week, so a list of up to ~600
 *     people stays on the free plan.
 */
import type { Payload } from 'payload'

import type { Media, Post, Subscriber } from '@/payload-types'

import { emailEnabled, escape, issueEmail, layout, sendBatch, siteUrl, type Email } from './email'
import { unsubscribeUrl } from './unsubscribe'

const WEEK = 7 * 864e5
const LOOKBACK = 14 * 864e5 // a new subscriber's first round-up covers at most the last two weeks

const coverUrl = (cover: Post['cover']) => {
  if (!cover || typeof cover !== 'object') return null
  const m = cover as Media
  const url = m.sizes?.card?.url || m.url
  if (!url) return null
  return url.startsWith('http') ? url : `${siteUrl()}${url}`
}

/** The weekly round-up email for one subscriber. */
export function digestEmail(to: string, posts: Post[], unsubscribe: string): Email {
  const items = posts
    .map((p) => {
      const img = coverUrl(p.cover)
      const link = `${siteUrl()}/blog/${p.slug}`
      return `<tr><td style="padding:0 0 28px">
${img ? `<a href="${link}"><img src="${img}" alt="" width="496" style="display:block;width:100%;max-width:496px;height:auto;border-radius:8px;border:0;margin:0 0 12px"></a>` : ''}
<a href="${link}" style="color:#111318;text-decoration:none;font-size:20px;font-weight:bold;line-height:1.25">${escape(p.title)}</a>
<p style="margin:6px 0 8px;color:#3A3E47;font-size:15px;line-height:1.55">${escape(p.excerpt ?? '')}</p>
<a href="${link}" style="color:#E40C48;font-weight:bold;font-size:14px;text-decoration:none">Read the post →</a>
</td></tr>`
    })
    .join('')
  const lead = posts[0]?.title ?? 'New on Giantability'
  return {
    to,
    unsubscribe,
    subject: posts.length > 1 ? `This week on Giantability: ${lead} and more` : `New on Giantability: ${lead}`,
    html: layout(`<p style="margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#007A7E;font-weight:bold">This week on Giantability</p>
<h1 style="margin:0 0 24px;font-size:26px;line-height:1.15">${posts.length === 1 ? 'A new post for you' : `${posts.length} new posts for you`}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
<a href="${siteUrl()}/blog" style="display:inline-block;background:#E40C48;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">See all posts</a>
<p style="margin:28px 0 0;font-size:12px;color:#5A5F6B">You're getting this because you joined the Giantability mailing list. <a href="${unsubscribe}" style="color:#5A5F6B">Unsubscribe</a></p>`),
  }
}

/** Published posts from the last two weeks, newest first (the pool every round-up draws from). */
export async function recentPosts(payload: Payload) {
  const res = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { publishedAt: { less_than_equal: new Date().toISOString() } },
        { publishedAt: { greater_than: new Date(Date.now() - LOOKBACK).toISOString() } },
      ],
    },
    sort: '-publishedAt',
    limit: 12,
    depth: 1,
  })
  return res.docs
}

const postsFor = (sub: Subscriber, pool: Post[]) => {
  const since = Math.max(
    sub.lastDigestAt ? Date.parse(sub.lastDigestAt) : Date.parse(sub.createdAt),
    Date.now() - LOOKBACK,
  )
  return pool.filter((p) => Date.parse(p.publishedAt) > since).slice(0, 6)
}

type RunResult = {
  emailEnabled: boolean
  issue?: { title: string; sent: number; remaining: number; done: boolean }
  digest: { sent: number; waiting: number }
  note?: string
}

export async function runDailyEmails(payload: Payload, limit: number): Promise<RunResult> {
  // Without Resend nothing can be sent, so nothing is marked as sent either:
  // everything waits until the email service is connected.
  if (!emailEnabled()) {
    return { emailEnabled: false, digest: { sent: 0, waiting: 0 }, note: 'Email not connected yet (RESEND_API_KEY). Nothing sent.' }
  }
  let budget = limit
  const result: RunResult = { emailEnabled: true, digest: { sent: 0, waiting: 0 } }

  // 1. New magazine issue announcements come first.
  const due = await payload.find({
    collection: 'issues',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { releaseDate: { less_than_equal: new Date().toISOString() } },
        { notifySubscribers: { equals: true } },
        { notificationsDone: { not_equals: true } },
      ],
    },
    sort: 'releaseDate',
    limit: 1,
    depth: 0,
  })
  const issue = due.docs[0]
  if (issue) {
    const batch = await payload.find({
      collection: 'subscribers',
      where: {
        and: [
          { active: { equals: true } },
          { or: [{ lastNotifiedIssue: { exists: false } }, { lastNotifiedIssue: { not_equals: issue.id } }] },
        ],
      },
      sort: 'createdAt',
      limit: budget,
      depth: 0,
    })
    if (batch.docs.length) {
      await sendBatch(
        batch.docs.map((s) =>
          issueEmail(s.email, { title: issue.title, issueNumber: issue.issueNumber, summary: issue.summary, slug: issue.slug ?? '' }, unsubscribeUrl(s.email)),
        ),
      )
      await payload.update({
        collection: 'subscribers',
        where: { id: { in: batch.docs.map((s) => s.id) } },
        data: { lastNotifiedIssue: issue.id },
      })
      budget -= batch.docs.length
    }
    const done = batch.totalDocs <= batch.docs.length
    if (done) await payload.update({ collection: 'issues', id: issue.id, data: { notificationsDone: true } })
    result.issue = { title: issue.title, sent: batch.docs.length, remaining: batch.totalDocs - batch.docs.length, done }
  }

  // 2. Weekly round-ups with whatever allowance is left.
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  if (settings.weeklyDigest === false || budget <= 0) return result
  const pool = await recentPosts(payload)
  if (!pool.length) return result

  const dueSubs = await payload.find({
    collection: 'subscribers',
    where: {
      and: [
        { active: { equals: true } },
        { or: [{ lastDigestAt: { exists: false } }, { lastDigestAt: { less_than_equal: new Date(Date.now() - WEEK + 36e5).toISOString() } }] },
      ],
    },
    sort: 'lastDigestAt',
    limit: Math.min(500, budget * 4),
    depth: 0,
  })
  const ready = dueSubs.docs.map((s) => ({ s, posts: postsFor(s, pool) })).filter((x) => x.posts.length)
  const now = ready.slice(0, budget)
  if (now.length) {
    await sendBatch(now.map(({ s, posts }) => digestEmail(s.email, posts, unsubscribeUrl(s.email))))
    await payload.update({
      collection: 'subscribers',
      where: { id: { in: now.map(({ s }) => s.id) } },
      data: { lastDigestAt: new Date().toISOString() },
    })
  }
  result.digest = { sent: now.length, waiting: Math.max(0, ready.length - now.length) }
  return result
}
