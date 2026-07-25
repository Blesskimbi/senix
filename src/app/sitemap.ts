import type { MetadataRoute } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { listPublishedPosts, postDate } from '@features/blog/posts';

// Posts are published from /internal/blog without a deploy, so the sitemap is
// generated per request rather than baked at build time.
export const dynamic = 'force-dynamic';

/**
 * Public sitemap. Lists the static marketing/docs routes plus every published
 * blog post, so new posts become crawlable as soon as they are published.
 * Authenticated and API routes are intentionally excluded (see robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/docs', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/changelog', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const staticEntries: MetadataRoute.Sitemap = entries.map((e) => ({
    url: canonicalUrl(e.path),
    lastModified: now,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));

  // Published posts. listPublishedPosts swallows query errors and returns [],
  // so a database hiccup degrades to the static sitemap instead of a 500.
  const posts = await listPublishedPosts(500);
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: canonicalUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updated_at ?? postDate(post)),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
