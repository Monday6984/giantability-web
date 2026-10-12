'use client'

import { useActionState, useState } from 'react'

import { submitEnquiry, type FormState } from '@/app/(frontend)/actions'

type Kind = 'partnership' | 'collaboration' | 'advertising'
type Way = { type: Kind; blurb: string; packages: { name: string; description: string; price?: string | null }[] }

const LABELS: Record<Kind, string> = {
  partnership: 'Partnership',
  collaboration: 'Collaboration',
  advertising: 'Advertising',
}
const ORDER: Kind[] = ['partnership', 'collaboration', 'advertising']

export function PartnerSection({
  ways,
  budgetOptions,
  partnersEmail,
  replyTime,
  mediaKitUrl,
}: {
  ways: Way[]
  budgetOptions: string[]
  partnersEmail?: string | null
  replyTime?: string | null
  mediaKitUrl?: string | null
}) {
  const tabs = ORDER.filter((k) => ways.some((w) => w.type === k))
  const [tab, setTab] = useState<Kind>(tabs[0] ?? 'partnership')
  const [kind, setKind] = useState<Kind>(tabs[0] ?? 'partnership')
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, null)
  const active = ways.find((w) => w.type === tab)

  return (
    <>
      {tabs.length > 0 && (
        <section aria-labelledby="ways-h" style={{ background: 'var(--soft)' }}>
          <div className="wrap section" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <h2 id="ways-h" className="display h-l">
              Ways to work with us
            </h2>
            <div role="tablist" aria-label="Ways to work with us" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tabs.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  id={`tab-${k}`}
                  aria-controls="ways-panel"
                  aria-selected={tab === k}
                  className="pill"
                  style={{ fontWeight: 600, minHeight: 48 }}
                  onClick={() => {
                    setTab(k)
                    setKind(k)
                  }}
                >
                  {LABELS[k]}
                </button>
              ))}
            </div>
            {active && (
              <div
                id="ways-panel"
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}
              >
                <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3 className="h-m" style={{ fontSize: 30 }}>
                    {LABELS[active.type]}
                  </h3>
                  <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2)' }}>{active.blurb}</p>
                </div>
                <div className="packages" style={{ flex: '2 1 480px' }}>
                  {active.packages.map((p) => (
                    <div key={p.name}>
                      <span style={{ fontWeight: 600, fontSize: 17 }}>{p.name}</span>
                      <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)' }}>{p.description}</span>
                      {p.price && <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-dark)' }}>{p.price}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="enquire" aria-labelledby="enq-h" className="wrap section" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 id="enq-h" className="display h-l">
            Start a conversation
          </h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2)' }}>
            Tell us what you have in mind.{replyTime ? ` The partnerships team replies within ${replyTime}.` : ''}
          </p>
          {(partnersEmail || mediaKitUrl) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, paddingTop: 8 }}>
              {partnersEmail && (
                <>
                  <span style={{ fontWeight: 600 }}>Prefer email?</span>
                  <a href={`mailto:${partnersEmail}`}>{partnersEmail}</a>
                </>
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
                Your {state.message} enquiry is with the partnerships team, and they&apos;ll reply by email.
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
              {budgetOptions.length > 0 && (
                <label className="field">
                  Budget range
                  <select name="budget" defaultValue="Not sure yet">
                    <option>Not sure yet</option>
                    {budgetOptions.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                Tell us about it
                <textarea name="message" rows={5} required />
              </label>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
              {state && !state.ok && (
                <p role="alert" className="form-msg error">
                  {state.message}
                </p>
              )}
              <button type="submit" className="btn lg" style={{ alignSelf: 'flex-start' }} disabled={pending}>
                {pending ? 'Sending…' : 'Send enquiry'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
