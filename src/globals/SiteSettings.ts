import { ValidationError, type GlobalConfig } from 'payload'

import { anyone, isLoggedIn } from '../access'
import { revalidateAll } from '../lib/revalidate'
import { resolveChannelId } from '../lib/youtube'

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
              maxRows: 3,
              admin: {
                description:
                  'One short card each for Partnership, Collaboration and Advertising, each inviting people to talk to management. No prices: terms are agreed in conversation.',
              },
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
                {
                  name: 'blurb',
                  label: 'One line about it',
                  type: 'textarea',
                  required: true,
                  maxLength: 180,
                  admin: { description: 'Keep it to a sentence or two (180 characters at most).' },
                },
              ],
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
              admin: {
                description:
                  'Paid ads. Only ticked ads inside their dates are shown; if several run in the same place they take turns. When none is running, the GMN "Advertise with us" banner shows instead.',
              },
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
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'image',
                      label: 'Banner image',
                      type: 'upload',
                      relationTo: 'media',
                      required: true,
                      filterOptions: { mimeType: { contains: 'image' } },
                      admin: {
                        description:
                          'Homepage: 1940 × 500 px (970 × 250 shown). In posts: 1456 × 180 px (728 × 90 shown). Shown in full, never cropped.',
                      },
                    },
                    {
                      name: 'mobileImage',
                      label: 'Phone version (optional)',
                      type: 'upload',
                      relationTo: 'media',
                      filterOptions: { mimeType: { contains: 'image' } },
                      admin: {
                        description: 'Shown on phones instead: 600 × 500 px works well. Without it, the banner above is shrunk to fit.',
                      },
                    },
                  ],
                },
                { name: 'link', type: 'text', required: true, admin: { description: 'Where a click goes, e.g. https://advertiser.com' } },
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
          label: 'Mailing list',
          fields: [
            {
              name: 'weeklyDigest',
              label: 'Send the weekly round-up of new posts',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Each subscriber gets at most one email a week listing posts published since their last one. New magazine issues are announced separately (tick "Email subscribers on release" on the issue).',
              },
            },
          ],
        },
        {
          label: 'View counts',
          fields: [
            {
              name: 'minViewsShown',
              label: 'Hide view counts below',
              type: 'number',
              min: 0,
              defaultValue: 50,
              admin: {
                description:
                  'Posts and magazine issues with fewer views than this show no count at all (rather than e.g. "3 views"). The admin always shows the exact numbers. 0 = always show.',
              },
            },
          ],
        },
        {
          label: 'Giantability TV',
          fields: [
            {
              name: 'youtubeChannel',
              label: 'YouTube channel link',
              type: 'text',
              defaultValue: 'https://www.youtube.com/@Giantability',
              admin: {
                description:
                  'The Giantability TV page and the homepage strip show the newest videos from this channel automatically (refreshed about every hour).',
              },
            },
            {
              // Worked out from the link when it is saved (YouTube's video feed needs the channel's ID).
              name: 'youtubeChannelId',
              type: 'text',
              defaultValue: 'UCTA9_aY4ehU7lkq3nSi2dBw',
              admin: { hidden: true },
            },
            {
              name: 'tvOnHomepage',
              label: 'Show the newest videos on the homepage',
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
        {
          label: 'Contact & social',
          fields: [
            {
              name: 'contactEmail',
              type: 'email',
              admin: { description: 'Shown in the footer of every page and on the Partner page.' },
            },
            {
              name: 'phones',
              label: 'Phone numbers',
              type: 'array',
              maxRows: 4,
              admin: { description: 'Shown in the footer and on the Partner page. Write the number as it should appear, with the country code.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'number', type: 'text', required: true, admin: { description: 'e.g. +234 913 061 6867' } },
                    { name: 'label', type: 'text', admin: { description: 'Optional, e.g. Nigeria' } },
                  ],
                },
              ],
            },
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
    beforeChange: [
      // A new channel link: look up its channel ID once, here, so the site can read its video feed.
      async ({ data, originalDoc, req }) => {
        const link = typeof data.youtubeChannel === 'string' ? data.youtubeChannel.trim() : ''
        if (!link) return { ...data, youtubeChannel: '', youtubeChannelId: '' }
        if (link === originalDoc?.youtubeChannel && originalDoc?.youtubeChannelId) return data
        const id = await resolveChannelId(link)
        if (!id) {
          throw new ValidationError({
            global: 'site-settings',
            req,
            errors: [
              {
                path: 'youtubeChannel',
                message: "Couldn't find that YouTube channel. Paste the channel's link, e.g. https://www.youtube.com/@Giantability",
              },
            ],
          })
        }
        return { ...data, youtubeChannel: link, youtubeChannelId: id }
      },
    ],
    afterChange: [() => revalidateAll()],
  },
}
