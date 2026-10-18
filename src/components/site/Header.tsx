'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/partner', label: 'Partner with us' },
]

export function Header() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const dark = path.startsWith('/magazine')
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))
  const cta = path.startsWith('/partner')
    ? { href: '#enquire', label: 'Start a conversation' }
    : { href: '/#subscribe', label: 'Subscribe' }

  // Close the menu after navigating, and with the Escape key.
  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={`site-header${dark ? ' dark' : ''}${open ? ' menu-open' : ''}`}>
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Giantability Media Networks, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-logo"
            src={dark ? '/brand/gmn-logo-white.png' : '/brand/gmn-logo.png'}
            alt=""
            width={90}
            height={60}
          />
          <span className="brand-words" aria-hidden="true">
            <span className="brand-name">Giantability</span>
            <span className="brand-sub">Media Networks</span>
          </span>
        </Link>

        <nav aria-label="Main" className="nav nav-desktop">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <a className="btn header-cta" href={cta.href}>
          {cta.label}
        </a>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Main" className="wrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <a className="btn lg" href={cta.href} onClick={() => setOpen(false)} style={{ marginTop: 12 }}>
            {cta.label}
          </a>
        </nav>
      </div>
    </header>
  )
}
