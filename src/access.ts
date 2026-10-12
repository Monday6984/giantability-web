import type { Access, FieldAccess } from 'payload'

type MaybeUser = { role?: string | null } | null | undefined

export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

export const isAdmin: Access = ({ req }) => (req.user as MaybeUser)?.role === 'admin'

export const isAdminField: FieldAccess = ({ req }) => (req.user as MaybeUser)?.role === 'admin'

/**
 * Logged-in staff see everything (drafts and scheduled items included).
 * Visitors only see published documents.
 */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

export const anyone: Access = () => true
