'use client'

import { usePathname } from 'next/navigation'

import { SubscribeForm } from './SubscribeForm'

/** Mailing-list signup in the footer of every page except the homepage, which has its own. */
export function FooterSignup() {
  const path = usePathname()
  if (path === '/' || path.startsWith('/unsubscribe')) return null
  return (
    <div className="footer-signup">
      <div>
        <p className="footer-signup__title">Get the weekly round-up</p>
        <p className="footer-signup__sub">New posts once a week, plus each new magazine issue.</p>
      </div>
      <SubscribeForm source={`footer:${path}`} compact />
    </div>
  )
}
