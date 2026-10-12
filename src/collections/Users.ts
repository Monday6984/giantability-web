import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, isLoggedIn } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
  },
  auth: true,
  access: {
    read: isLoggedIn,
    // The very first user can always be created (Payload's first-user screen), after that admins only.
    create: isAdmin,
    update: ({ req, id }) => (req.user as { role?: string } | null)?.role === 'admin' || req.user?.id === id,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Admin — everything, including users and settings', value: 'admin' },
        { label: 'Editor — posts, issues, enquiries', value: 'editor' },
      ],
      access: { update: isAdminField },
      saveToJWT: true,
    },
  ],
}
