import { NextResponse, type NextRequest } from 'next/server'

import { payload } from '@/lib/data'
import { digestEmail, recentPosts } from '@/lib/mailing'

/** Shows this week's round-up email in the browser, exactly as subscribers would get it. Staff only. */
export async function GET(req: NextRequest) {
  const p = await payload()
  const { user } = await p.auth({ headers: req.headers })
  if (!user) return NextResponse.redirect(new URL('/admin/login', req.url))

  const posts = (await recentPosts(p)).slice(0, 6)
  if (!posts.length) {
    return new NextResponse(
      '<!doctype html><meta charset="utf-8"><p style="font-family:Arial;padding:32px">No posts were published in the last two weeks, so there is nothing to send this week.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
  const email = digestEmail(user.email ?? 'you@example.com', posts, '#unsubscribe')
  const banner = `<div style="font-family:Arial;background:#111318;color:#fff;padding:10px 16px;font-size:13px">Preview · Subject: <strong>${email.subject.replace(/</g, '&lt;')}</strong></div>`
  return new NextResponse(email.html.replace(/<body([^>]*)>/, `<body$1>${banner}`), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
