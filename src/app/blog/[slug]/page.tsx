import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@features/shared/components/site-nav';
import { TraeFooterSection } from '@features/marketing/components/trae/footer-section';
import { BlogPostArticle } from '@features/marketing/blog/blog-post-article';
import { getPostBySlug, getPostSlugs } from '@features/marketing/blog/posts';
import { JsonLd, articleSchema } from '@/components/json-ld';
import { buildMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams(): Array<{ slug: string }> {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return buildMetadata({ title: 'Post not found', path: `/blog/${slug}` });
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
  });
}

/**
 * Individual blog post. Static params come from the typed registry so
 * unknown slugs 404 at request time (and are omitted from the build).
 */
export default async function BlogPostPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="trae-site">
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: post.author,
        })}
      />
      <SiteNav variant="trae" />
      <main className="blog-main">
        <div className="relative pt-16 sm:pt-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40" />
          </div>
          <div className="relative">
            <BlogPostArticle post={post} />
          </div>
        </div>
      </main>
      <TraeFooterSection />
    </div>
  );
}
