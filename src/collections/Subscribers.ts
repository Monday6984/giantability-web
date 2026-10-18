import type { CollectionConfig } from 'payload'

import { isAdmin, isLoggedIn } from '../access'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    group: 'Inbox',
    defaultColumns: ['email', 'active', 'source', 'lastDigestAt', 'createdAt'],
    description:
      'People on the mailing list. They get a weekly round-up of new posts and a note when a magazine issue comes out. Untick "Active" to stop emailing someone.',
    components: {
      beforeListTable: ['@/components/admin/MailingTools#MailingTools'],
    },
  },
  defaultSort: '-createdAt',
  access: { read: isLoggedIn, create: isLoggedIn, update: isLoggedIn, delete: isAdmin },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'source', type: 'text', admin: { readOnly: true, description: 'Where they signed up.' } },
    {
      name: 'lastDigestAt',
      label: 'Last weekly email',
      type: 'date',
      index: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'lastNotifiedIssue',
      type: 'relationship',
      relationTo: 'issues',
      admin: { readOnly: true, description: 'The latest issue this person has been emailed about.' },
    },
  ],
}
