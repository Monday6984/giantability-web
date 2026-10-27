/**
 * Email through Resend's HTTP API (free plan: 3,000 a month, 100 a day).
 * With no RESEND_API_KEY set, emails are skipped and logged, so local development works without it.
 */

export type Email = { to: string; subject: string; html: string; replyTo?: string; unsubscribe?: string }

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const from = () => process.env.EMAIL_FROM ?? 'Giantability <no-reply@example.com>'
// Where readers' replies go (the sending address has no inbox). Enquiry alerts reply to the enquirer instead.
const defaultReplyTo = () => process.env.EMAIL_REPLY_TO || undefined

export const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

async function resend(path: string, body: unknown) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[email] RESEND_API_KEY not set — skipped ${path}`)
    return false
  }
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  return true
}

/** True when emails can actually be sent (Resend is connected). */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY)

const toPayload = (e: Email) => ({
  from: from(),
  to: [e.to],
  subject: e.subject,
  html: e.html,
  reply_to: e.replyTo ?? defaultReplyTo(),
  headers: e.unsubscribe ? { 'List-Unsubscribe': `<${e.unsubscribe}>` } : undefined,
})

export const sendEmail = (e: Email) => resend('/emails', toPayload(e))

/** Sends up to 100 emails in one request. */
export const sendBatch = (emails: Email[]) => (emails.length ? resend('/emails/batch', emails.map(toPayload)) : false)

export const layout = (inner: string) => `<!doctype html><html><body style="margin:0;background:#F4F5F7;font-family:Arial,Helvetica,sans-serif;color:#111318">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:12px" cellpadding="0" cellspacing="0">
<tr><td style="padding:24px 32px 0"><img src="${siteUrl()}/brand/gmn-logo.png" alt="Giantability Media Network" width="84" height="56" style="display:block;border:0"></td></tr>
<tr><td style="padding:16px 32px 32px;font-size:16px;line-height:1.6">${inner}</td></tr></table>
<p style="font-size:12px;color:#5A5F6B">Giantability Media Network</p></td></tr></table></body></html>`

export async function sendEnquiryAlert(doc: {
  id: string | number
  type: string
  name: string
  organisation?: string | null
  email: string
  phone?: string | null
  message: string
}) {
  const to = process.env.ENQUIRY_NOTIFY_EMAIL
  if (!to) return false
  const rows = [
    ['Type', doc.type],
    ['Name', doc.name],
    ['Organisation', doc.organisation ?? ''],
    ['Email', doc.email],
    ['Phone', doc.phone ?? ''],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5A5F6B">${k}</td><td>${escape(String(v))}</td></tr>`)
    .join('')
  return sendEmail({
    to,
    replyTo: doc.email,
    subject: `New ${doc.type} enquiry from ${doc.name}`,
    html: layout(`<p style="margin:0 0 16px">A new enquiry came in from the Partner page.</p>
<table role="presentation" style="font-size:15px;margin-bottom:16px">${rows}</table>
<p style="white-space:pre-line;margin:0 0 20px">${escape(doc.message)}</p>
<a href="${siteUrl()}/admin/collections/enquiries/${doc.id}" style="color:#E40C48;font-weight:bold">Open in the admin</a>`),
  })
}

export const issueEmail = (
  to: string,
  issue: { title: string; issueNumber: number; summary?: string | null; slug: string },
  unsubscribe: string,
): Email => ({
  to,
  unsubscribe,
  subject: `New issue: ${issue.title}`,
  html: layout(`<p style="margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#E40C48;font-weight:bold">Issue ${issue.issueNumber} is out</p>
<h1 style="margin:0 0 12px;font-size:28px;line-height:1.1">${escape(issue.title)}</h1>
${issue.summary ? `<p style="margin:0 0 20px">${escape(issue.summary)}</p>` : ''}
<a href="${siteUrl()}/magazine/${issue.slug}" style="display:inline-block;background:#E40C48;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Read it online</a>
<p style="margin:28px 0 0;font-size:12px;color:#5A5F6B">You're getting this because you joined the Giantability mailing list. <a href="${unsubscribe}" style="color:#5A5F6B">Unsubscribe</a></p>`),
})
