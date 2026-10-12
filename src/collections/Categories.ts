import type { CollectionConfig } from 'payload'

import { anyone, isLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { revalidate } from '../lib/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name', group: 'Content', defaultColumns: ['name', 'slug'] },
  access: { read: anyone, create: isLoggedIn, update: isLoggedIn, delete: isLoggedIn },
  fields: [{ name: 'name', type: 'text', required: true }, slugField('name')],
  hooks: {
    afterChange: [() => revalidate('/blog', '/', '/blog/category/[slug]')],
  },
}
