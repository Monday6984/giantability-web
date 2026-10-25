import { NextResponse, type NextRequest } from 'next/server'

import { payload } from '@/lib/data'
import { runDailyEmails } from '@/lib/mailing'
import { revalidate } from '@/lib/revalidate'
import { saveVideoCopy } from '@/lib/youtube'

/**
 * Runs once a day (vercel.json → crons; Vercel Hobby allows one run a day).
 * Refreshes listings for posts and issues scheduled for today, then sends the mailing list's
 * emails (new-issue announcements and weekly round-ups) within the daily email allowance.
 */
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Scheduled posts and issues go live on their date; refresh the cached pages that list them.
  revalidate('/', '/blog', '/magazine', '/rss.xml', '/sitemap.xml')

  const p = await payload()
  // Keep a saved copy of the Giantability TV video list, used if YouTube is ever unreachable.
  const tv = await saveVideoCopy(p).catch((err) => ({ error: String(err) }))

  const limit = Math.min(100, Number(process.env.DAILY_EMAIL_LIMIT) || 90)
  const result = await runDailyEmails(p, limit)
  return NextResponse.json({ ...result, tv })
}
