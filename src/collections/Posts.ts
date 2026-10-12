import type { CollectionConfig } from 'payload'

import { isLoggedIn, publishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { viewCountField } from '../fields/viewCount'
import { revalidate } from '../lib/revalidate'
import { readingMinutes } from '../lib/text'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'publishedAt', '_status', 'views'],
    description:
      'Weekly posts. Publish with a future "Publish on" date to schedule a post: it appears on the site on that date.',
    listSearchableFields: ['title', 'excerpt'],
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/blog/${doc.slug}`,
  },
  defaultSort: '-publishedAt',
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 280,
      admin: { description: 'One or two sentences shown on cards, under the headline and in search results.' },
    },
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'body', type: 'richText', required: true },
    slugField(),
    {
      name: 'publishedAt',
      label: 'Publish on',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'A future date schedules the post. It stays hidden until then.',
      },
    },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true, admin: { position: 'sidebar' } },
    { name: 'author', type: 'relationship', relationTo: 'authors', admin: { position: 'sidebar' } },
    { name: 'tags', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'readingTime',
      type: 'number',
      admin: { position: 'sidebar', description: 'Minutes. Leave empty to estimate from the text.' },
    },
    viewCountField('post', 'Views'),
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.readingTime && data.body) data.readingTime = readingMinutes(data.body)
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        revalidate('/', '/blog', `/blog/${doc.slug}`, '/blog/category/[slug]', '/rss.xml', '/sitemap.xml')
      },
    ],
    afterDelete: [() => revalidate('/', '/blog')],
  },
}
