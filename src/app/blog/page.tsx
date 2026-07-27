import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@features/shared/components/site-nav';
import { TraeFooterSection } from '@features/marketing/components/trae/footer-section';
import { Reveal } from '@features/shared/components/reveal';
import { buildMetadata, canonicalUrl } from '@/lib/seo';
import { listPublishedPosts, authorName, postDate } from '@features/blog/posts';

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description: 'The Senix blog — notes on AI code review, PR risk, and shipping safely.',
  path: '/blog',
});

// Posts are published from /internal/blog without a deploy, so the index is
// rendered per request rather than baked at build time.
export const dynamic = 'force-dynamic';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Public blog index. Lists published posts newest first and emits a Blog
 * JSON-LD graph so search engines can associate posts with the site.
 */
export default async function BlogPage(): Promise<React.ReactElement> {
  const posts = await listPublishedPosts();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Senix Blog',
    url: canonicalUrl('/blog'),
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: canonicalUrl(`/blog/${p.slug}`),
      datePublished: postDate(p),
      author: { '@type': 'Person', name: authorName(p) },
    })),
  };

  return (
    <>
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="border-b border-zinc-800/40">
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative max-w-3xl mx-auto px-5 sm:px-6 pt-20 sm:pt-28 pb-12 text-center">
            <Reveal>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-green-500/80">
                Blog
              </span>
              <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
                Notes on shipping safely
              </h1>
              <p className="mt-4 text-[15px] sm:text-base text-zinc-400 leading-relaxed">
                What we are learning building AI code review — PR risk, review quality, and
                the engineering behind Senix.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-24">
          {posts.length === 0 ? (
            <p className="text-center text-zinc-500">No posts yet. Check back soon.</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-6 transition-colors hover:border-green-500/40 hover:bg-zinc-900/60"
                  >
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <time dateTime={postDate(post)}>{formatDate(postDate(post))}</time>
                      <span aria-hidden>·</span>
                      <span>{authorName(post)}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100 group-hover:text-white">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-block text-sm font-medium text-green-500/90 group-hover:text-green-400">
                      Read more →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <TraeFooterSection />
    </>
  );
}
