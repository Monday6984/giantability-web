import Link from 'next/link'

import { getSettings } from '@/lib/data'

import { FooterSignup } from './FooterSignup'

export async function Footer() {
  const settings = await getSettings()
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <FooterSignup />
      </div>
      <div className="wrap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/gmn-logo-white.png" alt="Giantability Media Networks" width={90} height={60} style={{ height: 60, width: 'auto', alignSelf: 'flex-start' }} />
          <span style={{ fontSize: 14 }}>Giantability Media Networks · © {new Date().getFullYear()}</span>
        </div>
        <nav aria-label="Footer">
          <Link href="/blog">Blog</Link>
          <Link href="/magazine">Magazine</Link>
          <Link href="/partner">Partner with us</Link>
          <a href="/rss.xml">RSS</a>
          {(settings.social ?? []).map((s) => (
            <a key={s.id ?? s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
          <a href="/admin">Admin login</a>
        </nav>
      </div>
    </footer>
  )
}
