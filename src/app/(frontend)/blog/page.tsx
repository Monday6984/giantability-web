import type { Metadata } from 'next'

import { BlogList } from '@/components/site/BlogList'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'New posts every week from Giantability Media Networks.',
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page, q } = await searchParams
  return <BlogList page={Math.max(1, Number(page) || 1)} q={q?.trim().slice(0, 100) || undefined} />
}
