import { NextResponse, type NextRequest } from 'next/server'

import { payload } from '@/lib/data'

/** Downloads the mailing list as a CSV file (opens in Excel or Google Sheets). Logged-in staff only. */
export async function GET(req: NextRequest) {
  const p = await payload()
  const { user } = await p.auth({ headers: req.headers })
  if (!user) return NextResponse.redirect(new URL('/admin/login', req.url))

  const rows: string[][] = [['email', 'active', 'joined', 'source', 'last_weekly_email']]
  for (let page = 1, more = true; more; page++) {
    const res = await p.find({ collection: 'subscribers', sort: 'createdAt', limit: 500, page, depth: 0 })
    for (const s of res.docs) {
      rows.push([s.email, s.active === false ? 'no' : 'yes', s.createdAt.slice(0, 10), s.source ?? '', s.lastDigestAt?.slice(0, 10) ?? ''])
    }
    more = res.hasNextPage
  }
  // Quote every cell; a leading = + - @ is neutralised so spreadsheets never run it as a formula.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n')
  const day = new Date().toISOString().slice(0, 10)
  return new NextResponse(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gmn-mailing-list-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
