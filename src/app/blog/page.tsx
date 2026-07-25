import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@features/shared/components/site-nav';
import { TraeFooterSection } from '@features/marketing/components/trae/footer-section';
import { Reveal, RevealItem, RevealStagger } from '@features/shared/components/reveal';
import { formatPostDate, getAllPosts } from '@features/marketing/blog/posts';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description:
    'Notes on AI code review, pull request risk, and shipping safely with Cursor, Copilot, and Claude Code.',
  path: '/blog',
  keywords: ['AI code review', 'AI PR review', 'Senix blog', 'pull request risk'],
});

/**
 * Public blog index. Posts live in features/marketing/blog/posts.ts;
 * newest first. Chrome matches Trae marketing pages (legal/landing).
 */
export default function BlogPage(): React.ReactElement {
  const posts = getAllPosts();

  return (
    <div className="trae-site">
      <SiteNav variant="trae" />
      <main className="blog-main">
        <section className="relative border-b border-white/[0.06]">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40" />
          </div>
          <div className="relative trae-section pt-20 sm:pt-28 pb-12 text-center">
            <Reveal>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#32f08c]/80">
                Blog
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-white">
                Senix Blog
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 text-[#c9c5d2] leading-relaxed max-w-xl mx-auto">
                Notes on AI code review and shipping safely with Cursor, Copilot, and Claude
                Code.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="trae-section py-16 max-w-3xl">
          <RevealStagger className="space-y-8">
            {posts.map((post) => (
              <RevealItem key={post.slug}>
                <article className="group border-b border-white/[0.08] pb-8 last:border-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#8b8794]">
                    <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                    <span aria-hidden className="text-[#8b8794]/50">
                      ·
                    </span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white group-hover:text-[#32f08c] transition">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-3 text-[15px] text-[#c9c5d2] leading-relaxed">
                    {post.description}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-flex text-sm font-medium text-[#32f08c] hover:text-[#3ee1a3] transition"
                  >
                    Read more →
                  </Link>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </section>
      </main>
      <TraeFooterSection />
    </div>
  );
}
