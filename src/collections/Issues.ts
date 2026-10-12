import type { CollectionConfig } from 'payload'

import { isLoggedIn, publishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { viewCountField } from '../fields/viewCount'
import { revalidate } from '../lib/revalidate'

export const Issues: CollectionConfig = {
  slug: 'issues',
  labels: { singular: 'Magazine issue', plural: 'Magazine issues' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['issueNumber', 'title', 'releaseDate', '_status', 'views'],
    description:
      'Upload each issue as one PDF. Publish with a future release date to schedule it; subscribers are emailed from that day.',
  },
  defaultSort: '-releaseDate',
  access: {
    read: publishedOrLoggedIn,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  versions: { drafts: true, maxPerDoc: 10 },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'issueNumber', label: 'Issue no.', type: 'number', required: true, admin: { width: '25%' } },
        { name: 'title', type: 'text', required: true, admin: { width: '75%' } },
      ],
    },
    { name: 'summary', type: 'textarea', admin: { description: "What's inside, in one or two lines." } },
    {
      type: 'row',
      fields: [
        {
          name: 'cover',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: { mimeType: { contains: 'image' } },
        },
        {
          name: 'pdf',
          label: 'Magazine PDF',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: { mimeType: { equals: 'application/pdf' } },
          admin: { description: 'Export for screen (about 150 dpi) to keep it fast — ideally under 40 MB.' },
        },
      ],
    },
    {
      name: 'contents',
      label: 'In this issue',
      type: 'array',
      admin: { description: 'Shown under the reader; clicking a line jumps to that page.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'section', type: 'text', required: true },
            {
              name: 'page',
              type: 'number',
              required: true,
              min: 1,
              admin: { description: "The PDF's own page number. If the PDF is laid out as two-page spreads, each spread counts as one page." },
            },
          ],
        },
      ],
    },
    slugField(),
    {
      name: 'releaseDate',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', description: 'A future date schedules the issue.' },
    },
    { name: 'allowDownload', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'notifySubscribers',
      label: 'Email subscribers on release',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'notificationsDone',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Ticked automatically once every subscriber has been emailed.',
      },
    },
    viewCountField('issue', 'Reads'),
  ],
  hooks: {
    afterChange: [({ doc }) => revalidate('/', '/magazine', `/magazine/${doc.slug}`, '/sitemap.xml')],
    afterDelete: [() => revalidate('/', '/magazine')],
  },
}
