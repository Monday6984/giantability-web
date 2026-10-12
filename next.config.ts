import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // The WordPress importer parses HTML on the server with jsdom; keep it out of the bundle.
  serverExternalPackages: ['jsdom'],
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    // pdf.js "legacy" build includes polyfills, so the magazine reader works on older phones and browsers.
    webpackConfig.resolve.alias = { ...webpackConfig.resolve.alias, 'pdfjs-dist$': 'pdfjs-dist/legacy/build/pdf.mjs' }
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
    resolveAlias: { 'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs' },
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
