import type { Metadata } from 'next'

import { PartnerSection } from '@/components/site/PartnerSection'
import { getSettings, mediaUrl } from '@/lib/data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Partner with us',
  description: 'Partnership, collaboration and advertising with Giantability Media Networks.',
}

export default async function PartnerPage() {
  const settings = await getSettings()
  const audience = settings.audience ?? []
  const ways = (settings.ways ?? []).map((w) => ({ type: w.type, blurb: w.blurb }))

  return (
    <>
      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span className="kicker">Partnership · Collaboration · Advertising</span>
        <h1 className="display" style={{ fontSize: 'clamp(44px, 6.5vw, 88px)', lineHeight: 0.95, letterSpacing: '-0.035em', maxWidth: '12em' }}>
          Reach our readers, every week and every issue.
        </h1>
        {settings.partnerIntro && <p className="standfirst" style={{ fontSize: 22, maxWidth: '36em' }}>{settings.partnerIntro}</p>}
        {audience.length > 0 && (
          <div className="stats" style={{ marginTop: 16 }}>
            {audience.map((a) => (
              <div key={a.id ?? a.label}>
                <strong>{a.value}</strong>
                <span className="muted" style={{ fontSize: 14 }}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <PartnerSection
        ways={ways}
        partnersEmail={settings.partnersEmail || settings.contactEmail}
        phones={settings.phones}
        replyTime={settings.replyTime}
        mediaKitUrl={mediaUrl(settings.mediaKit)}
      />
    </>
  )
}
