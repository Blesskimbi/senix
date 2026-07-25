import type { MetadataRoute } from 'next';
import { getAllPosts } from '@features/marketing/blog/posts';
import { canonicalUrl } from '@/lib/seo';

/**
 * Public sitemap. Lists the static marketing/docs routes with sensible
 * change frequencies and priorities, plus every published blog post.
 * Authenticated and API routes are intentionally excluded (see robots.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
    lastModified?: Date;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/docs', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/changelog', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const posts = getAllPosts().map((post) => ({
    path: `/blog/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
  }));

  return [...entries, ...posts].map((e) => ({
    url: canonicalUrl(e.path),
    lastModified: e.lastModified ?? now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
