import type { Metadata } from 'next'
import Script from 'next/script'
import React from 'react'

import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { PageViewTracker } from '@/components/site/TrackView'

import './styles.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Giantability Media Networks', template: '%s · Giantability' },
  description: 'Weekly stories and a magazine from Giantability Media Networks.',
  openGraph: { siteName: 'Giantability Media Networks', type: 'website' },
  alternates: { types: { 'application/rss+xml': '/rss.xml' } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umami = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Loaded as a stylesheet (not next/font) so builds never depend on fetching fonts. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap"
        />
      </head>
      <body>
        <a href="#content" className="sr-only">
          Skip to content
        </a>
        <div className="page">
          <Header />
          <main id="content">{children}</main>
          <Footer />
        </div>
        <PageViewTracker />
        {umami && <Script src="https://cloud.umami.is/script.js" data-website-id={umami} strategy="afterInteractive" />}
      </body>
    </html>
  )
}
