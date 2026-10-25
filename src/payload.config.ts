import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { DailyViews } from './collections/DailyViews'
import { Enquiries } from './collections/Enquiries'
import { Issues } from './collections/Issues'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Subscribers } from './collections/Subscribers'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { TvCache } from './globals/TvCache'
import { loadDefaults } from './lib/defaults'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const r2Configured = Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID)
const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Giantability admin' },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      // The admin home page opens on the Overview: views, top posts, new enquiries.
      beforeDashboard: ['@/components/admin/Overview#Overview'],
      afterNavLinks: ['@/components/admin/ImportView#ImportNavLink'],
      views: {
        wpImport: { Component: '@/components/admin/ImportView#ImportView', path: '/import' },
      },
      graphics: {
        Logo: '@/components/admin/Brand#Logo',
        Icon: '@/components/admin/Brand#Icon',
      },
    },
  },
  collections: [Posts, Issues, Categories, Authors, Media, Enquiries, Subscribers, Users, DailyViews],
  globals: [SiteSettings, TvCache],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Production applies the committed migrations on start-up; local dev pushes schema changes directly.
    prodMigrations: migrations,
  }),
  sharp,
  // First start on an empty database: add the blog categories and Partner page wording.
  onInit: async (payload) => {
    try {
      await loadDefaults(payload)
    } catch (err) {
      payload.logger.error({ err, msg: 'Could not load starting content' })
    }
  },
  plugins: [
    s3Storage({
      enabled: r2Configured,
      collections: {
        media: r2PublicUrl
          ? {
              // Files are served straight from R2's public URL, so they never use Vercel bandwidth.
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename, prefix }) =>
                `${r2PublicUrl}/${[prefix, filename].filter(Boolean).join('/')}`,
            }
          : true,
      },
      // Files go straight from the browser to R2, so large photos and magazine PDFs
      // are not blocked by Vercel's 4.5 MB request limit. Needs a CORS rule allowing PUT (see README).
      clientUploads: true,
      bucket: process.env.R2_BUCKET || '',
      config: {
        // Only send checksums when required; keeps uploads compatible with R2.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
      },
    }),
  ],
})
