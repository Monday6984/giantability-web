import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import type { Media, Post } from '@/payload-types'

/**
 * Images in a post body use one full, uncropped picture (the 1600px "hero" copy when it exists).
 * The default renderer offers every stored size, including the portrait 720×960 magazine-cover crop,
 * which phones would pick and which cuts landscape photos.
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }: { node: SerializedUploadNode }) => {
    const media = node.value as Media | number | string
    if (!media || typeof media !== 'object') return null
    if (!media.mimeType?.startsWith('image/')) {
      return (
        <p>
          <a href={media.url ?? '#'} target="_blank" rel="noreferrer">
            {media.filename ?? 'Download file'}
          </a>
        </p>
      )
    }
    const src = media.sizes?.hero?.url || media.url || ''
    const width = media.sizes?.hero?.url ? media.sizes.hero.width : media.width
    const height = media.sizes?.hero?.url ? media.sizes.hero.height : media.height
    return (
      <figure className="post-image">
        <img src={src} alt={media.alt ?? ''} width={width ?? undefined} height={height ?? undefined} loading="lazy" />
        {(media.caption || media.credit) && (
          <figcaption>{[media.caption, media.credit && `Photo: ${media.credit}`].filter(Boolean).join(' · ')}</figcaption>
        )}
      </figure>
    )
  },
})

export function PostBody({ body }: { body: Post['body'] }) {
  return <RichText data={body} converters={converters} />
}
