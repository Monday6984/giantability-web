import type { GlobalConfig } from 'payload'

import { anyone, isLoggedIn } from '../access'
import { revalidate } from '../lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isLoggedIn },
  fields: [
    {
      // Set once the starting content has been loaded (src/lib/defaults.ts), so it is never re-added.
      name: 'defaultsLoaded',
      type: 'checkbox',
      defaultValue: false,
      admin: { hidden: true },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Homepage',
          fields: [
            {
              name: 'featuredPost',
              type: 'relationship',
              relationTo: 'posts',
              admin: { description: 'The big story at the top of the homepage. Empty = the newest post.' },
            },
            {
              name: 'cadenceLine',
              type: 'text',
              defaultValue: 'New posts every week · New magazine issues every quarter',
              admin: { description: 'The strip under the homepage feature.' },
            },
          ],
        },
        {
          label: 'Partner page',
          fields: [
            {
              name: 'partnerIntro',
              type: 'textarea',
              defaultValue:
                'Brands, creators and organisations work with Giantability to reach a loyal weekly readership and the magazine audience.',
            },
            {
              name: 'audience',
              label: 'Audience figures',
              type: 'array',
              maxRows: 4,
              admin: { description: 'Shown as figures on the Partner page. Leave empty to hide the block.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', type: 'text', required: true, admin: { description: 'e.g. 45k' } },
                    { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Monthly page views' } },
                  ],
                },
              ],
            },
            {
              name: 'ways',
              label: 'Ways to work with us',
              type: 'array',
              admin: { description: 'One entry per tab: Partnership, Collaboration, Advertising.' },
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Partnership', value: 'partnership' },
                    { label: 'Collaboration', value: 'collaboration' },
                    { label: 'Advertising', value: 'advertising' },
                  ],
                },
                { name: 'blurb', type: 'textarea', required: true },
                {
                  name: 'packages',
                  type: 'array',
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'price', type: 'text', admin: { description: 'e.g. From ₦150,000 / week, or "By agreement"' } },
                  ],
                },
              ],
            },
            {
              name: 'budgetOptions',
              type: 'text',
              hasMany: true,
              admin: { description: 'Choices in the form\'s budget dropdown.' },
            },
            { name: 'partnersEmail', type: 'email' },
            { name: 'replyTime', type: 'text', defaultValue: '2 working days' },
            { name: 'mediaKit', label: 'Media kit (PDF)', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Ad slots',
          fields: [
            {
              name: 'ads',
              type: 'array',
              admin: { description: 'Ads shown on the site. Only active ads inside their dates are shown.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'advertiser', type: 'text', required: true },
                    {
                      name: 'placement',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Homepage banner', value: 'home' },
                        { label: 'In-article (posts)', value: 'article' },
                      ],
                    },
                  ],
                },
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'link', type: 'text', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'startDate', type: 'date' },
                    { name: 'endDate', type: 'date' },
                    { name: 'active', type: 'checkbox', defaultValue: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Footer & social',
          fields: [
            {
              name: 'social',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, admin: { description: 'e.g. Instagram' } },
                    { name: 'url', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [() => revalidate('/', '/partner', '/blog/[slug]')],
  },
}
