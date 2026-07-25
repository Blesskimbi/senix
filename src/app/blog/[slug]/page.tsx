import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@features/shared/components/site-nav';
import { TraeFooterSection } from '@features/marketing/components/trae/footer-section';
import { buildMetadata, canonicalUrl, siteConfig } from '@/lib/seo';
import { getPublishedPost, authorName, postDate } from '@features/blog/posts';
import { renderMarkdown, readingTimeMinutes } from '@features/blog/markdown';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

/**
 * Per-post metadata: real title/description, a canonical URL, and an
 * article-type OG card so shared links render properly. Unknown or draft
 * slugs get no metadata (the page itself 404s).
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return buildMetadata({ title: 'Post not found', path: `/blog/${slug}` });

  const description = post.excerpt ?? siteConfig.description;
  const base = buildMetadata({
    title: post.title,
    description,
    path: `/blog/${post.slug}`,
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: postDate(post),
      modifiedTime: post.updated_at,
      authors: [authorName(post)],
      ...(post.cover_image_url
        ? { images: [{ url: post.cover_image_url, alt: post.title }] }
        : {}),
    },
  };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Public post page. Drafts and unknown slugs both 404 (getPublishedPost
 * filters on status at the query level, so a guessed draft slug reveals
 * nothing). Markdown is rendered with raw HTML escaped.
 */
export default async function BlogPostPage({ params }: Params): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.content_md);
  const published = postDate(post);
  const minutes = readingTimeMinutes(post.content_md);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ?? undefined,
    datePublished: published,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: authorName(post) },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: { '@type': 'ImageObject', url: canonicalUrl('/icon.png') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl(`/blog/${post.slug}`) },
  };

  return (
    <>
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="border-b border-zinc-800/40">
        <article className="max-w-3xl mx-auto px-5 sm:px-6 pt-20 sm:pt-28 pb-20">
          <Link href="/blog" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← All posts
          </Link>

          <header className="mt-6 mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <time dateTime={published}>{formatDate(published)}</time>
              <span aria-hidden>·</span>
              <span>{authorName(post)}</span>
              <span aria-hidden>·</span>
              <span>{minutes} min read</span>
            </div>
          </header>

          {post.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt=""
              className="mb-10 w-full rounded-xl border border-zinc-800/70"
            />
          )}

          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </main>
      <TraeFooterSection />
    </>
  );
}
