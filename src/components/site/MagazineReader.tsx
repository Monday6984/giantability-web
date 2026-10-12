'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { DownloadIcon, FullscreenIcon } from './Icons'
import { track } from './TrackView'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

export type ReaderProps = {
  issueId: string
  pdfUrl: string
  title: string
  contents: { section: string; page: number }[]
  allowDownload: boolean
}

/** Pages shown together: the cover alone, then pairs (2–3, 4–5 …) on wide screens; one page at a time on phones. */
const buildSpreads = (pages: number, double: boolean) => {
  if (!double) return Array.from({ length: pages }, (_, i) => [i + 1])
  const spreads: number[][] = [[1]]
  for (let p = 2; p <= pages; p += 2) spreads.push(p + 1 <= pages ? [p, p + 1] : [p])
  return spreads
}

export default function MagazineReader({ issueId, pdfUrl, title, contents, allowDownload }: ReaderProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [pages, setPages] = useState(0)
  const [spread, setSpread] = useState(0)
  const [error, setError] = useState(false)
  const counted = useRef(false)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const double = width >= 720
  const spreads = useMemo(() => buildSpreads(pages, double), [pages, double])
  const current = spreads[Math.min(spread, spreads.length - 1)] ?? [1]
  const pageWidth = Math.min(double ? (width - 8) / 2 : width, 620)

  // A read is counted once the visitor turns past the cover.
  useEffect(() => {
    if (counted.current || current[0] <= 1) return
    counted.current = true
    try {
      const key = `gmn-read-${issueId}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // storage blocked — the server cookie still prevents double counting
    }
    track('issue', issueId)
  }, [current, issueId])

  const goToPage = useCallback(
    (page: number) => {
      const idx = spreads.findIndex((s) => s.includes(page))
      if (idx >= 0) setSpread(idx)
    },
    [spreads],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return
      if (e.key === 'ArrowRight') setSpread((s) => Math.min(spreads.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setSpread((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spreads.length])

  const label = current.length > 1 ? `${current[0]}–${current[1]}` : `${current[0]}`
  const progress = spreads.length ? ((spread + 1) / spreads.length) * 100 : 0

  return (
    <div className="with-aside" style={{ paddingBottom: 72 }}>
      <section aria-label={`Reader: ${title}`} className="main-col reader">
        <div className="reader-stage" ref={stageRef}>
          {error ? (
            <p style={{ color: '#D5DCE6', textAlign: 'center' }}>
              This issue couldn&apos;t load in the reader.{' '}
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                Open the PDF instead
              </a>
              .
            </p>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setPages(numPages)}
              onLoadError={() => setError(true)}
              loading={<p style={{ color: '#D5DCE6' }}>Loading the magazine…</p>}
            >
              <div className="spread">
                {current.map((n) => (
                  <Page
                    key={n}
                    pageNumber={n}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<div style={{ width: pageWidth, aspectRatio: '3 / 4', background: '#F7F7F5' }} />}
                  />
                ))}
              </div>
              {/* Preload the next spread so turning the page feels instant. */}
              <div style={{ display: 'none' }} aria-hidden="true">
                {(spreads[spread + 1] ?? []).map((n) => (
                  <Page key={`pre-${n}`} pageNumber={n} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                ))}
              </div>
            </Document>
          )}
        </div>

        <div className="reader-controls">
          <button type="button" className="ctl" onClick={() => setSpread((s) => Math.max(0, s - 1))} disabled={spread === 0}>
            ← Prev
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '1 1 200px' }}>
            <span role="status" style={{ fontSize: 15, color: '#D5DCE6' }}>
              {pages ? `Page${current.length > 1 ? 's' : ''} ${label} of ${pages}` : 'Loading…'}
            </span>
            <div className="progress" aria-hidden="true">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            type="button"
            className="ctl"
            onClick={() => setSpread((s) => Math.min(spreads.length - 1, s + 1))}
            disabled={!pages || spread >= spreads.length - 1}
          >
            Next →
          </button>
        </div>
      </section>

      <aside aria-labelledby="toc-h" className="toc">
        <h2 id="toc-h" className="h-m" style={{ fontSize: 22, marginBottom: 8 }}>
          In this issue
        </h2>
        {contents.length === 0 && <p style={{ margin: 0, color: '#D5DCE6' }}>Use Prev and Next to turn the pages.</p>}
        {contents.map((c) => (
          <button key={`${c.section}-${c.page}`} type="button" aria-current={current.includes(c.page)} onClick={() => goToPage(c.page)}>
            <span>{c.section}</span>
            <span style={{ fontSize: 13, opacity: 0.75 }}>p. {c.page}</span>
          </button>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {allowDownload && (
            <a className="btn" href={pdfUrl} target="_blank" rel="noreferrer" download>
              <DownloadIcon /> Download PDF
            </a>
          )}
          <button
            type="button"
            className="ctl"
            onClick={() => stageRef.current?.requestFullscreen?.()}
            aria-label="Read full screen"
          >
            <FullscreenIcon />
          </button>
        </div>
      </aside>
    </div>
  )
}
