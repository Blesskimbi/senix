import { canonicalUrl, siteConfig } from '@/lib/seo';
import { listPublishedPosts, authorName, postDate } from '@features/blog/posts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Escape the five XML predefined entities. */
function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /blog/rss.xml — RSS 2.0 feed of published posts. Gives readers and
 * aggregators (and some crawlers) a canonical, machine-readable index that
 * updates the moment a post is published.
 */
export async function GET(): Promise<Response> {
  const posts = await listPublishedPosts(50);
  const self = canonicalUrl('/blog/rss.xml');

  const items = posts
    .map((post) => {
      const url = canonicalUrl(`/blog/${post.slug}`);
      return [
        '    <item>',
        `      <title>${xml(post.title)}</title>`,
        `      <link>${xml(url)}</link>`,
        `      <guid isPermaLink="true">${xml(url)}</guid>`,
        `      <pubDate>${new Date(postDate(post)).toUTCString()}</pubDate>`,
        `      <dc:creator>${xml(authorName(post))}</dc:creator>`,
        post.excerpt ? `      <description>${xml(post.excerpt)}</description>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(`${siteConfig.name} Blog`)}</title>
    <link>${xml(canonicalUrl('/blog'))}</link>
    <description>${xml('Notes on AI code review, PR risk, and shipping safely.')}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
}
