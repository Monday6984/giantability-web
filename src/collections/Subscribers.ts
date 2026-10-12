import type { CollectionConfig } from 'payload'

import { isAdmin, isLoggedIn } from '../access'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    group: 'Inbox',
    defaultColumns: ['email', 'active', 'source', 'createdAt'],
    description: 'People who joined the mailing list. Untick "Active" to stop emailing someone.',
  },
  defaultSort: '-createdAt',
  access: { read: isLoggedIn, create: isLoggedIn, update: isLoggedIn, delete: isAdmin },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'source', type: 'text', admin: { readOnly: true, description: 'Where they signed up.' } },
    {
      name: 'lastNotifiedIssue',
      type: 'relationship',
      relationTo: 'issues',
      admin: { readOnly: true, description: 'The latest issue this person has been emailed about.' },
    },
  ],
}
