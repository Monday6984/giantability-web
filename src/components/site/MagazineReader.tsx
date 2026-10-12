'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { DownloadIcon, FullscreenIcon } from './Icons'
import { track } from './TrackView'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

// Helper files copied to /public/pdfjs at build time (scripts/copy-pdfjs.mjs).
// Without them some images (JPEG 2000, JBIG2), colour profiles and built-in fonts don't render.
const PDF_OPTIONS = {
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
  wasmUrl: '/pdfjs/wasm/',
  iccUrl: '/pdfjs/iccs/',
}

export type ReaderProps = {
  issueId: string
  pdfUrl: string
  title: string
  contents: { section: string; page: number }[]
  allowDownload: boolean
}

const ZOOMS = [1, 1.5, 2]

type Half = 'left' | 'right'
type View = { pages: number[]; half?: Half }

/**
 * What is shown together:
 * - Single portrait pages on a wide screen: the cover alone, then pairs (2–3, 4–5 …) like a printed magazine.
 * - PDF pages that are already two-page spreads (landscape): one spread at a time on a wide screen,
 *   and on a phone each spread split into its left and right halves so the text stays readable.
 * - Portrait pages on a phone: one page at a time.
 */
const buildViews = (pages: number, landscape: boolean, wide: boolean): View[] => {
  if (!landscape && wide) {
    const views: View[] = [{ pages: [1] }]
    for (let p = 2; p <= pages; p += 2) views.push({ pages: p + 1 <= pages ? [p, p + 1] : [p] })
    return views
  }
  if (landscape && !wide) {
    // The cover (page 1) is usually a single portrait page, so it is shown whole.
    const views: View[] = [{ pages: [1] }]
    for (let p = 2; p <= pages; p++) views.push({ pages: [p], half: 'left' }, { pages: [p], half: 'right' })
    return views
  }
  return Array.from({ length: pages }, (_, i) => ({ pages: [i + 1] }))
}

export default function MagazineReader({ issueId, pdfUrl, title, contents, allowDownload }: ReaderProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(900)
  const [pages, setPages] = useState(0)
  const [landscape, setLandscape] = useState(false)
  const [view, setView] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState(false)
  const counted = useRef(false)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const wide = stageWidth >= 760
  const pairUp = !landscape && wide
  const views = useMemo(() => buildViews(pages, landscape, wide), [pages, landscape, wide])
  const currentView = views[Math.min(view, views.length - 1)] ?? { pages: [1] }
  const current = currentView.pages
  const half = currentView.half
  // Fit the view to the reader's width, then apply the chosen zoom.
  // A half-spread is drawn at twice the width and cropped to the side being read.
  const fit = Math.floor(((pairUp ? stageWidth / 2 : stageWidth) - 2) * zoom)
  const pageWidth = half ? fit * 2 : fit

  const onLoad = useCallback(
    async (pdf: { numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number } }> }) => {
      setPages(pdf.numPages)
      try {
        // Judge by an inside page: covers are often portrait even when the rest are spreads.
        const sample = await pdf.getPage(Math.min(2, pdf.numPages))
        const vp = sample.getViewport({ scale: 1 })
        setLandscape(vp.width > vp.height)
      } catch {
        // keep the default layout
      }
    },
    [],
  )

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

  const go = useCallback(
    (next: number) => {
      setView(Math.max(0, Math.min(views.length - 1, next)))
      stageRef.current?.scrollTo({ top: 0, left: 0 })
    },
    [views.length],
  )

  const goToPage = useCallback(
    (page: number) => {
      const idx = views.findIndex((v) => v.pages.includes(page))
      if (idx >= 0) go(idx)
    },
    [views, go],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return
      if (e.key === 'ArrowRight') go(view + 1)
      if (e.key === 'ArrowLeft') go(view - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, view])

  const label =
    current.length > 1 ? `${current[0]}–${current[1]}` : `${current[0]}${half ? ` (${half === 'left' ? 'left' : 'right'} half)` : ''}`
  const progress = views.length ? ((view + 1) / views.length) * 100 : 0
  const zoomIndex = ZOOMS.indexOf(zoom)

  return (
    <div className="reader-shell" ref={shellRef}>
      <section aria-label={`Reader: ${title}`} className="reader">
        <div className="reader-stage" ref={stageRef} data-zoomed={zoom > 1 ? 'true' : undefined}>
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
              options={PDF_OPTIONS}
              onLoadSuccess={onLoad}
              onLoadError={() => setError(true)}
              loading={<p style={{ color: '#D5DCE6' }}>Loading the magazine…</p>}
            >
              <div className="spread" style={half ? { width: fit, overflow: 'hidden', justifyContent: 'flex-start' } : undefined}>
                <div style={half === 'right' ? { marginLeft: -fit } : undefined} className="spread-pages">
                  {current.map((n) => (
                    <Page
                      key={n}
                      pageNumber={n}
                      width={pageWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<div style={{ width: pageWidth, aspectRatio: landscape ? '1.41 / 1' : '3 / 4', background: '#F7F7F5' }} />}
                    />
                  ))}
                </div>
              </div>
              {/* Preload the next view so turning the page feels instant. */}
              <div style={{ display: 'none' }} aria-hidden="true">
                {(views[view + 1]?.pages ?? []).map((n) => (
                  <Page key={`pre-${n}`} pageNumber={n} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                ))}
              </div>
            </Document>
          )}
        </div>

        <div className="reader-controls">
          <button type="button" className="ctl" onClick={() => go(view - 1)} disabled={view === 0}>
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
          <button type="button" className="ctl" onClick={() => go(view + 1)} disabled={!pages || view >= views.length - 1}>
            Next →
          </button>
        </div>

        <div className="reader-tools">
          <div role="group" aria-label="Zoom" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button type="button" className="ctl" aria-label="Zoom out" disabled={zoomIndex <= 0} onClick={() => setZoom(ZOOMS[zoomIndex - 1] ?? 1)}>
              −
            </button>
            <span style={{ minWidth: 52, textAlign: 'center', color: '#D5DCE6', fontSize: 14 }}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="ctl"
              aria-label="Zoom in"
              disabled={zoomIndex >= ZOOMS.length - 1}
              onClick={() => setZoom(ZOOMS[zoomIndex + 1] ?? zoom)}
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ctl"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen?.()
                else shellRef.current?.requestFullscreen?.()
              }}
            >
              <FullscreenIcon /> Full screen
            </button>
            {allowDownload && (
              <a className="ctl" href={pdfUrl} target="_blank" rel="noreferrer" download>
                <DownloadIcon /> Download PDF
              </a>
            )}
          </div>
        </div>
      </section>

      {contents.length > 0 && (
        <nav aria-labelledby="toc-h" className="toc">
          <h2 id="toc-h" className="h-m" style={{ fontSize: 20 }}>
            In this issue
          </h2>
          <div className="toc-list">
            {contents.map((c) => (
              <button key={`${c.section}-${c.page}`} type="button" aria-current={current.includes(c.page)} onClick={() => goToPage(c.page)}>
                <span>{c.section}</span>
                <span style={{ fontSize: 13, opacity: 0.75 }}>p. {c.page}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
