import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogList } from '@/components/site/BlogList'
import { getCategoryBySlug } from '@/lib/data'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; q?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug)
  return category ? { title: `${category.name} · Blog` } : {}
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page, q }] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()
  return <BlogList category={category} page={Math.max(1, Number(page) || 1)} q={q?.trim().slice(0, 100) || undefined} />
}
