'use client'

import { useActionState, useState } from 'react'

import { submitEnquiry, type FormState } from '@/app/(frontend)/actions'
import { telHref } from '@/lib/text'

import { PhoneIcon } from './Icons'

type Kind = 'partnership' | 'collaboration' | 'advertising'
type Way = { type: Kind; blurb: string }

const LABELS: Record<Kind, string> = {
  partnership: 'Partnership',
  collaboration: 'Collaboration',
  advertising: 'Advertising',
}
const ORDER: Kind[] = ['partnership', 'collaboration', 'advertising']

export function PartnerSection({
  ways,
  partnersEmail,
  phones,
  replyTime,
  mediaKitUrl,
}: {
  ways: Way[]
  partnersEmail?: string | null
  phones?: { id?: string | null; number: string; label?: string | null }[] | null
  replyTime?: string | null
  mediaKitUrl?: string | null
}) {
  const cards = ORDER.map((k) => ways.find((w) => w.type === k)).filter((w): w is Way => Boolean(w))
  const [kind, setKind] = useState<Kind>(cards[0]?.type ?? 'partnership')
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, null)

  const talkAbout = (k: Kind) => {
    setKind(k)
    document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {cards.length > 0 && (
        <section aria-labelledby="ways-h" style={{ background: 'var(--soft)' }}>
          <div className="wrap section" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <h2 id="ways-h" className="display h-l">
              Ways to work with us
            </h2>
            <div className="ways">
              {cards.map((w) => (
                <div key={w.type} className="way">
                  <h3 className="h-m" style={{ fontSize: 26 }}>
                    {LABELS[w.type]}
                  </h3>
                  <p>{w.blurb}</p>
                  <button type="button" className="text-link way-cta" onClick={() => talkAbout(w.type)}>
                    Let&apos;s talk about it →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="enquire" aria-labelledby="enq-h" className="wrap section" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 id="enq-h" className="display h-l">
            Talk to our management
          </h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Every partnership is shaped in conversation. Call us, or send a short note and we&apos;ll arrange a discussion
            {replyTime ? ` within ${replyTime}` : ''}.
          </p>
          {phones && phones.length > 0 && (
            <div className="call-list">
              {phones.map((p) => (
                <a key={p.id ?? p.number} className="call-btn" href={`tel:${telHref(p.number)}`}>
                  <PhoneIcon />
                  <span>{p.number}</span>
                  {p.label && <span className="call-label">{p.label}</span>}
                </a>
              ))}
            </div>
          )}
          {(partnersEmail || mediaKitUrl) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, paddingTop: 4 }}>
              {partnersEmail && (
                <span>
                  Email: <a href={`mailto:${partnersEmail}`}>{partnersEmail}</a>
                </span>
              )}
              {mediaKitUrl && (
                <a href={mediaKitUrl} target="_blank" rel="noreferrer">
                  Download the media kit (PDF)
                </a>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: '2 1 520px', minWidth: 0 }}>
          {state?.ok ? (
            <div role="status" style={{ padding: 40, borderRadius: 16, background: 'var(--navy)', color: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="display" style={{ fontSize: 32 }}>
                Thanks — we&apos;ve got it.
              </span>
              <span style={{ fontSize: 17, lineHeight: 1.6, color: '#D5DCE6' }}>
                Your {state.message} enquiry is with our management team, and they&apos;ll be in touch to arrange a discussion.
              </span>
            </div>
          ) : (
            <form action={action} className="form">
              <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>I&apos;m interested in</legend>
                <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 10 }}>
                  {ORDER.map((k) => (
                    <label key={k} className="choice">
                      <input type="radio" name="type" value={k} checked={kind === k} onChange={() => setKind(k)} /> {LABELS[k]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid-2">
                <label className="field">
                  Full name
                  <input name="name" type="text" required autoComplete="name" />
                </label>
                <label className="field">
                  Organisation
                  <input name="organisation" type="text" autoComplete="organization" />
                </label>
                <label className="field">
                  Email
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                <label className="field">
                  Phone / WhatsApp
                  <input name="phone" type="tel" autoComplete="tel" />
                </label>
              </div>
              <label className="field">
                What would you like to discuss?
                <textarea name="message" rows={5} required />
              </label>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
              {state && !state.ok && (
                <p role="alert" className="form-msg error">
                  {state.message}
                </p>
              )}
              <button type="submit" className="btn lg" style={{ alignSelf: 'flex-start' }} disabled={pending}>
                {pending ? 'Sending…' : 'Request a discussion'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
