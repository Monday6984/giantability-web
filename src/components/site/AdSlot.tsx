import Link from 'next/link'

import { getActiveAds, mediaUrl } from '@/lib/data'

type Placement = 'home' | 'article'

/**
 * An advert slot. Shows a paid ad from Site settings → Ad slots when one is running for this
 * placement (several running ads take turns), otherwise GMN's own "advertise with us" banner.
 */
export async function AdSlot({ placement }: { placement: Placement }) {
  const ads = await getActiveAds(placement)
  const ad = ads.length ? ads[Math.floor(Math.random() * ads.length)] : null
  const desktop = ad ? mediaUrl(ad.image, 'hero') : null
  const mobile = ad ? mediaUrl(ad.mobileImage, 'hero') : null

  return (
    <aside aria-label="Advertisement" className={`ad ad--${placement}`}>
      <span className="ad-label">Advertisement</span>
      {ad && desktop ? (
        <a href={ad.link} target="_blank" rel="sponsored noopener noreferrer" className="ad-paid">
          <picture>
            {mobile && <source media="(max-width: 640px)" srcSet={mobile} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={desktop} alt={`Advertisement: ${ad.advertiser}`} loading="lazy" />
          </picture>
        </a>
      ) : (
        <HouseAd placement={placement} />
      )}
    </aside>
  )
}

/** GMN's own banner: fills the slot until an advertiser books it, and shows what an ad here looks like. */
function HouseAd({ placement }: { placement: Placement }) {
  return (
    <Link href="/partner" className={`house-ad house-ad--${placement}`}>
      {/* The logo's swoosh, echoed along the bottom of the banner, clear of the text. */}
      <svg className="house-ad__swoosh" aria-hidden="true" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M-10 108 C 110 60, 260 58, 410 78" fill="none" stroke="#E40C48" strokeWidth="10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M-10 118 C 120 72, 270 72, 410 94" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="house-ad__logo" src="/brand/gmn-logo-white.png" alt="" width={96} height={64} />
      <span className="house-ad__copy">
        <span className="house-ad__kicker">Advertise with Giantability</span>
        <span className="house-ad__title">
          {placement === 'home' ? 'Put your brand in front of our readers' : 'Your brand could be here'}
        </span>
        <span className="house-ad__sub">Weekly posts · Online magazine · Mailing list</span>
      </span>
      <span className="house-ad__cta">See ad packages →</span>
    </Link>
  )
}
