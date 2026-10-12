'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/partner', label: 'Partner with us' },
]

export function Header() {
  const path = usePathname()
  const dark = path.startsWith('/magazine')
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))

  return (
    <header className={`site-header${dark ? ' dark' : ''}`}>
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="brand-name">GIANTABILITY</span>
          <span className="brand-sub">Media Networks</span>
        </Link>
        <nav aria-label="Main" className="nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        {path.startsWith('/partner') ? (
          <a className="btn" href="#enquire">
            Start a conversation
          </a>
        ) : (
          <a className="btn" href="/#subscribe">
            Subscribe
          </a>
        )}
      </div>
    </header>
  )
}
