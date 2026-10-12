import type { MetadataRoute } from 'next'

import { getCategories, getIssues, getPosts } from '@/lib/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const [posts, issues, categories] = await Promise.all([getPosts({ limit: 1000 }), getIssues(), getCategories()])
  return [
    { url: `${site}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/blog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site}/magazine`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site}/partner`, changeFrequency: 'monthly', priority: 0.6 },
    ...categories.map((c) => ({ url: `${site}/blog/category/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...posts.docs.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ...issues.map((i) => ({ url: `${site}/magazine/${i.slug}`, lastModified: i.updatedAt, priority: 0.6 })),
  ]
}
