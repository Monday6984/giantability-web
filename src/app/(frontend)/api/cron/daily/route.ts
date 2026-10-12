import { NextResponse, type NextRequest } from 'next/server'

import { payload } from '@/lib/data'
import { issueEmail, sendBatch } from '@/lib/email'
import { revalidate } from '@/lib/revalidate'
import { unsubscribeUrl } from '@/lib/unsubscribe'

/**
 * Runs once a day (vercel.json → crons; Vercel Hobby allows one run a day).
 * Emails subscribers about a newly released magazine issue, a capped number per day
 * so the total stays inside Resend's free plan (100 emails a day).
 */
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const limit = Math.min(100, Number(process.env.DAILY_EMAIL_LIMIT) || 90)
  const p = await payload()

  // Scheduled posts and issues go live on their date; refresh the cached pages that list them.
  revalidate('/', '/blog', '/magazine', '/rss.xml', '/sitemap.xml')

  const due = await p.find({
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
  if (!issue) return NextResponse.json({ sent: 0, note: 'No issue waiting to be announced.' })

  const batch = await p.find({
    collection: 'subscribers',
    where: {
      and: [
        { active: { equals: true } },
        { or: [{ lastNotifiedIssue: { exists: false } }, { lastNotifiedIssue: { not_equals: issue.id } }] },
      ],
    },
    sort: 'createdAt',
    limit,
    depth: 0,
  })

  if (batch.docs.length) {
    await sendBatch(
      batch.docs.map((s) =>
        issueEmail(s.email, { title: issue.title, issueNumber: issue.issueNumber, summary: issue.summary, slug: issue.slug ?? '' }, unsubscribeUrl(s.email)),
      ),
    )
    await p.update({
      collection: 'subscribers',
      where: { id: { in: batch.docs.map((s) => s.id) } },
      data: { lastNotifiedIssue: issue.id },
    })
  }

  const finished = batch.docs.length < limit || batch.totalDocs <= limit
  if (finished) {
    await p.update({ collection: 'issues', id: issue.id, data: { notificationsDone: true } })
  }

  return NextResponse.json({
    issue: issue.title,
    sent: batch.docs.length,
    remaining: Math.max(0, batch.totalDocs - batch.docs.length),
    done: finished,
  })
}
