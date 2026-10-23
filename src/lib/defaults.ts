import type { Payload } from 'payload'

/**
 * Starting content: the five blog categories and the Partner page wording from the approved concept.
 * Loaded automatically the first time the site starts on an empty database, then never again,
 * so anything the client edits or deletes stays that way.
 */
const categories = ['Business', 'Culture', 'Tech', 'Lifestyle', 'Interviews']

const ways = [
  { type: 'partnership' as const, blurb: 'Long-term, co-branded work for organisations that want a lasting presence with our readers.' },
  { type: 'collaboration' as const, blurb: 'Creative projects with writers, creators, brands and fellow media.' },
  { type: 'advertising' as const, blurb: 'Put your brand in front of our readers, on the website and in the magazine.' },
]

export async function loadDefaults(payload: Payload) {
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  if (settings.defaultsLoaded) return

  for (const name of categories) {
    const found = await payload.find({ collection: 'categories', where: { name: { equals: name } }, limit: 1 })
    if (!found.docs.length) await payload.create({ collection: 'categories', data: { name } })
  }
  
  if (!settings.ways?.length) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        ways,
        replyTime: settings.replyTime || '2 working days',
        contactEmail: settings.contactEmail || 'info@giantability.com',
        phones: settings.phones?.length
          ? settings.phones
          : [
              { number: '+1 317 937 9676', label: 'USA' },
              { number: '+234 913 061 6867', label: 'Nigeria' },
            ],
      },
    })
  }
  
  await payload.updateGlobal({ slug: 'site-settings', data: { defaultsLoaded: true } })
  payload.logger.info('Loaded starting content: categories and Partner page wording.')
}
