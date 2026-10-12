/**
 * Imports one WordPress post (already read from the export file in the browser) into Payload:
 * categories, author, featured and inline images (downloaded into Media / R2), and the body
 * converted from WordPress HTML to the editor's format. Re-running skips posts already imported.
 */
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { parseHTML } from 'linkedom'
import path from 'path'
import type { Payload } from 'payload'

import { slugify } from '../fields/slug'
import type { WpPost } from './wp-import-types'

export type { WpPost } from './wp-import-types'

export type ImportResult = {
  status: 'imported' | 'skipped' | 'failed'
  title: string
  id?: number | string
  slug?: string
  imagesOk?: number
  imagesFailed?: number
  message?: string
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024

// ---------- HTML parsing ----------

/**
 * A small stand-in for jsdom's JSDOM class built on linkedom, which is pure JavaScript and works in
 * serverless functions (jsdom needs extra files at runtime that Vercel deployments don't include).
 */
class DOM {
  window: { document: Document }
  constructor(html: string) {
    const page = /<html[\s>]/i.test(html) ? html : `<!doctype html><html><head></head><body>${html.replace(/^\s*<body>|<\/body>\s*$/gi, '')}</body></html>`
    this.window = parseHTML(page) as unknown as { document: Document }
  }
}

// ---------- HTML clean-up ----------

const BLOCK = /^<(p|div|h[1-6]|ul|ol|li|blockquote|figure|table|pre|hr|img|iframe|section|article|header|footer)\b/i

/** WordPress stores classic-editor posts without <p> tags; this recreates its automatic paragraphs. */
function autoParagraphs(html: string) {
  if (/<p[\s>]/i.test(html)) return html
  return html
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => (BLOCK.test(chunk) ? chunk : `<p>${chunk.replace(/\n/g, '<br>')}</p>`))
    .join('\n')
}

const SHORTCODES =
  /\[\/?(gallery|embed|video|audio|playlist|button|column|columns|row|one_half|one_third|two_third|contact-form-7|vc_[a-z_]+|et_pb_[a-z_]+|fusion_[a-z_]+|su_[a-z_]+)\b[^\]]*\]/gi

function cleanWordPressHtml(raw: string) {
  let html = raw
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '') // block editor markers
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi, (_m, inner: string) => {
      const img = inner.match(/<a[^>]*>\s*<img[^>]*>\s*<\/a>|<img[^>]*>/i)?.[0] ?? ''
      const caption = inner.replace(img, '').trim()
      return `<figure>${img}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`
    })
    .replace(SHORTCODES, '')
  html = autoParagraphs(html)
  // Embedded videos can't live in the editor; keep them as a link.
  html = html.replace(/<iframe[^>]*src=["']([^"']+)["'][^>]*>\s*<\/iframe>/gi, (_m, src: string) => {
    const url = (src.startsWith('//') ? `https:${src}` : src).replace(
      /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/([\w-]+).*$/,
      'https://www.youtube.com/watch?v=$3',
    )
    return `<p><a href="${url}">Watch the video</a></p>`
  })
  return html
}

// ---------- images ----------

const absolute = (url: string, siteUrl: string) => {
  try {
    return new URL(url.startsWith('//') ? `https:${url}` : url, siteUrl).toString()
  } catch {
    return null
  }
}

/** WordPress inserts resized copies (photo-300x200.jpg); try the full-size original first. */
const originalOf = (url: string) => url.replace(/-\d{2,5}x\d{2,5}(?=\.[a-z0-9]+(\?|$))/i, '')

async function download(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000), redirect: 'follow', headers: { 'User-Agent': 'GiantabilityImporter/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
  if (!type.startsWith('image/')) throw new Error(`not an image (${type || 'unknown type'})`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('image larger than 20 MB')
  return { buf, type }
}

async function importImage(payload: Payload, rawUrl: string, siteUrl: string, alt: string, caption = '') {
  const url = absolute(rawUrl, siteUrl)
  if (!url) throw new Error('bad image address')

  const existing = await payload.find({ collection: 'media', where: { sourceUrl: { equals: url } }, limit: 1, depth: 0 })
  if (existing.docs[0]) return existing.docs[0].id

  let file: { buf: Buffer; type: string } | null = null
  const full = originalOf(url)
  if (full !== url) {
    try {
      file = await download(full)
    } catch {
      file = null
    }
  }
  file ??= await download(url)

  const base = path.basename(new URL(full !== url && file ? full : url).pathname) || 'image'
  const name = decodeURIComponent(base).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120)
  const doc = await payload.create({
    collection: 'media',
    data: { alt: alt || undefined, caption: caption || undefined, sourceUrl: url },
    file: { data: file.buf, mimetype: file.type, name, size: file.buf.length },
  })
  return doc.id
}

// ---------- editor conversion ----------

let editorConfigPromise: ReturnType<typeof editorConfigFactory.default> | null = null

type LexNode = { type?: string; value?: unknown; pending?: unknown; children?: LexNode[]; [k: string]: unknown }

/** Upload ids come back as strings, and images that failed to download come back as "pending": tidy both. */
function tidyUploads(node: LexNode): LexNode | null {
  if (node.type === 'upload') {
    if (node.pending || node.value == null) return null
    if (typeof node.value === 'string' && /^\d+$/.test(node.value)) node.value = Number(node.value)
    delete node.pending
  }
  if (Array.isArray(node.children)) {
    node.children = node.children.map(tidyUploads).filter((n): n is LexNode => n !== null)
  }
  return node
}

const isEmptyParagraph = (n: LexNode) =>
  n.type === 'paragraph' &&
  (!n.children?.length ||
    n.children.every((c) => c.type === 'linebreak' || (c.type === 'text' && !String(c.text ?? '').trim())))

/**
 * Images must sit at the top level of the body, not inside a paragraph, and blank paragraphs
 * left over from WordPress spacing are dropped.
 */
function liftUploads(root: LexNode) {
  const out: LexNode[] = []
  for (const node of root.children ?? []) {
    if (node.type === 'paragraph' && node.children?.some((c) => c.type === 'upload')) {
      let buffer: LexNode[] = []
      const flush = () => {
        const para = { ...node, children: buffer }
        if (!isEmptyParagraph(para)) out.push(para)
        buffer = []
      }
      for (const child of node.children) {
        if (child.type === 'upload') {
          flush()
          out.push(child)
        } else buffer.push(child)
      }
      flush()
    } else if (!isEmptyParagraph(node)) out.push(node)
  }
  root.children = out
}

// ---------- helpers ----------

const text = (html: string) => {
  // Space out block elements so "<li>One</li><li>Two</li>" reads "One Two".
  const spaced = html.replace(/<\/(p|li|h[1-6]|blockquote|div|figcaption|td|th)>|<br\s*\/?>/gi, '$& ')
  const dom = new DOM(spaced)
  return (dom.window.document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

const excerptFrom = (wpExcerpt: string, html: string) => {
  const source = text(wpExcerpt) || text(html)
  if (source.length <= 260) return source || ' '
  return `${source.slice(0, 257).replace(/\s+\S*$/, '')}…`
}

async function findOrCreateCategory(payload: Payload, cat: { name: string; slug: string } | undefined) {
  const name = !cat || /^uncategori[sz]ed$/i.test(cat.name) ? 'General' : text(cat.name)
  const slug = slugify(cat && !/^uncategori[sz]ed$/i.test(cat.name) ? cat.slug || name : 'general')
  const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (found.docs[0]) return found.docs[0].id
  return (await payload.create({ collection: 'categories', data: { name, slug } })).id
}

async function findOrCreateAuthor(payload: Payload, name: string) {
  const clean = text(name)
  if (!clean) return undefined
  const found = await payload.find({ collection: 'authors', where: { name: { equals: clean } }, limit: 1, depth: 0 })
  if (found.docs[0]) return found.docs[0].id
  return (await payload.create({ collection: 'authors', data: { name: clean } })).id
}

async function freeSlug(payload: Payload, wanted: string) {
  const base = slugify(wanted) || 'post'
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const taken = await payload.find({ collection: 'posts', where: { slug: { equals: candidate } }, limit: 1, depth: 0, draft: true })
    if (!taken.docs.length) return candidate
  }
  return `${base}-${Date.now()}`
}

// ---------- main ----------

export async function importWordPressPost(payload: Payload, post: WpPost): Promise<ImportResult> {
  const title = text(post.title) || '(untitled)'

  const already = await payload.find({ collection: 'posts', where: { wpId: { equals: post.wpId } }, limit: 1, depth: 0, draft: true })
  if (already.docs[0]) return { status: 'skipped', title, id: already.docs[0].id, slug: already.docs[0].slug ?? undefined, message: 'Already imported' }

  let imagesOk = 0
  let imagesFailed = 0

  // Inline images: download each into Media and point the <img> at it.
  const dom = new DOM(cleanWordPressHtml(post.html))
  const doc = dom.window.document
  let firstImageId: number | string | null = null
  for (const img of Array.from(doc.querySelectorAll('img'))) {
    const src = img.getAttribute('src') ?? ''
    // Unwrap images that link to their own full-size file.
    const parent = img.parentElement
    if (parent?.tagName === 'A' && /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(parent.getAttribute('href') ?? '')) parent.replaceWith(img)
    // Images are blocks in the editor, so lift any image out of the paragraph it sits in.
    const para = img.closest('p')
    if (para) {
      para.parentNode?.insertBefore(img, para)
      if (!(para.textContent ?? '').trim() && !para.querySelector('img')) para.remove()
    }
    // A WordPress caption becomes the image's own caption, shown under it on the site.
    const figcaption = img.closest('figure')?.querySelector('figcaption')
    const caption = (figcaption?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)
    figcaption?.remove()
    try {
      const id = await importImage(payload, src, post.siteUrl, img.getAttribute('alt') ?? '', caption)
      firstImageId ??= id
      for (const attr of Array.from(img.attributes)) img.removeAttribute(attr.name)
      img.setAttribute('data-lexical-upload-relation-to', 'media')
      img.setAttribute('data-lexical-upload-id', String(id))
      imagesOk++
    } catch {
      img.remove()
      imagesFailed++
    }
  }

  let coverId: number | string | null = null
  if (post.featuredUrl) {
    try {
      coverId = await importImage(payload, post.featuredUrl, post.siteUrl, title)
      imagesOk++
    } catch {
      imagesFailed++
    }
  }
  coverId ??= firstImageId

  editorConfigPromise ??= editorConfigFactory.default({ config: payload.config })
  const editorConfig = await editorConfigPromise
  const body = convertHTMLToLexical({ editorConfig, html: doc.body.innerHTML, JSDOM: DOM })
  tidyUploads(body.root as unknown as LexNode)
  liftUploads(body.root as unknown as LexNode)

  const [categoryId, authorId, slug] = await Promise.all([
    findOrCreateCategory(payload, post.categories[0]),
    findOrCreateAuthor(payload, post.author),
    freeSlug(payload, post.slug || title),
  ])

  let legacyPath: string | undefined
  try {
    legacyPath = new URL(post.link).pathname.replace(/\/+$/, '') || undefined
  } catch {
    legacyPath = undefined
  }

  const published = post.status === 'publish' || post.status === 'future'
  const created = await payload.create({
    collection: 'posts',
    draft: !published,
    data: {
      title,
      excerpt: excerptFrom(post.excerpt, post.html),
      cover: coverId ?? undefined,
      body: body as never,
      slug,
      publishedAt: post.date,
      category: categoryId,
      author: authorId,
      tags: post.tags.map(text).filter(Boolean).slice(0, 20),
      legacyPath,
      wpId: post.wpId,
      _status: published ? 'published' : 'draft',
    },
  })

  return { status: 'imported', title, id: created.id, slug: created.slug ?? slug, imagesOk, imagesFailed }
}
