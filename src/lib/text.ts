/** Collects the plain text from a Lexical rich-text value. */
export const lexicalText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown[]; root?: unknown }
  if (n.root) return lexicalText(n.root)
  const own = typeof n.text === 'string' ? n.text : ''
  const kids = Array.isArray(n.children) ? n.children.map(lexicalText).join(' ') : ''
  return `${own} ${kids}`.trim()
}

/** Minutes to read, at about 220 words a minute. */
export const readingMinutes = (body: unknown) => {
  const words = lexicalText(body).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
