import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    description: 'Images and magazine PDFs. Files are stored in Cloudflare R2 when it is configured.',
  },
  access: {
    read: anyone,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: { description: 'Describe the image for screen readers and search engines. Not needed for PDFs.' },
    },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text' },
    // Where an imported image came from, so a re-run of the WordPress import reuses it.
    { name: 'sourceUrl', type: 'text', index: true, admin: { hidden: true } },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    // Resized copies are made once on upload, so pages never need paid image optimisation.
    imageSizes: [
      { name: 'card', width: 800, height: 500, position: 'centre' },
      { name: 'hero', width: 1600, height: undefined },
      { name: 'cover', width: 720, height: 960, position: 'centre' },
    ],
    adminThumbnail: 'card',
    focalPoint: true,
  },
}
