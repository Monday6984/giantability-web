import Link from 'next/link'

import { getActiveAd, mediaUrl } from '@/lib/data'

/** Shows the active ad for a placement, or a "your ad here" slot pointing to the Partner page. */
export async function AdSlot({ placement }: { placement: 'home' | 'article' }) {
  const ad = await getActiveAd(placement)
  const img = ad ? mediaUrl(ad.image, 'hero') : null

  return (
    <aside aria-label="Advertisement" className="ad">
      <span className="ad-label">Advertisement</span>
      {ad && img ? (
        <a href={ad.link} target="_blank" rel="sponsored noopener noreferrer">
          <img src={img} alt={`Advertisement: ${ad.advertiser}`} loading="lazy" />
        </a>
      ) : (
        <div
          style={{
            minHeight: 110,
            background: 'var(--soft)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            color: 'var(--muted)',
            textAlign: 'center',
            padding: 16,
          }}
        >
          Your brand here — reach Giantability readers every week.
        </div>
      )}
      <Link href="/partner" style={{ fontSize: 14 }}>
        Advertise with Giantability →
      </Link>
    </aside>
  )
}
