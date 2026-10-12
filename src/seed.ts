/**
 * Starting data: the five blog categories and the Partner page wording from the approved concept.
 * Run once after the first deploy:  pnpm seed
 * Safe to run again — it only fills what is empty.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const categories = ['Business', 'Culture', 'Tech', 'Lifestyle', 'Interviews']

const ways = [
  {
    type: 'partnership' as const,
    blurb: 'Ongoing, co-branded work for organisations that want a sustained presence with our readers.',
    packages: [
      { name: 'Sponsored series', description: 'A recurring column or theme across several weekly posts.', price: 'Price on request' },
      { name: 'Issue partner', description: 'Presenting partner of a magazine issue, with cover credit.', price: 'Price on request' },
      { name: 'Events & launches', description: 'Co-hosted events, panels and live coverage.', price: 'Price on request' },
      { name: 'Annual package', description: 'A bundled year of site, magazine and newsletter presence.', price: 'Price on request' },
    ],
  },
  {
    type: 'collaboration' as const,
    blurb: 'Creative work with writers, creators, brands and other media — usually no fee either way.',
    packages: [
      { name: 'Guest posts', description: 'Write for the blog under your own byline.', price: 'Editorial review' },
      { name: 'Interviews & features', description: 'Be featured in the magazine or a weekly post.', price: 'Editorial review' },
      { name: 'Content swaps', description: 'Cross-publish with partner outlets and newsletters.', price: 'By agreement' },
      { name: 'Creator projects', description: 'Joint video, audio or social campaigns.', price: 'By agreement' },
    ],
  },
  {
    type: 'advertising' as const,
    blurb: 'Paid placements on the website and inside the magazine.',
    packages: [
      { name: 'Homepage banner', description: 'Banner placement on the homepage for one week.', price: 'Price on request' },
      { name: 'In-article slot', description: 'Placement inside every weekly post.', price: 'Price on request' },
      { name: 'Magazine full page', description: 'Full-page ad in the online magazine.', price: 'Price on request' },
    ],
  },
]

const payload = await getPayload({ config })

for (const name of categories) {
  const found = await payload.find({ collection: 'categories', where: { name: { equals: name } }, limit: 1 })
  if (!found.docs.length) await payload.create({ collection: 'categories', data: { name } })
}

const settings = await payload.findGlobal({ slug: 'site-settings' })
if (!settings.ways?.length) {
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      ways,
      budgetOptions: settings.budgetOptions?.length ? settings.budgetOptions : ['Under ₦500,000', '₦500,000 – ₦2,000,000', 'Above ₦2,000,000'],
      replyTime: settings.replyTime || '2 working days',
    },
  })
}

payload.logger.info('Seed complete: categories and Partner page content are in place.')
process.exit(0)
