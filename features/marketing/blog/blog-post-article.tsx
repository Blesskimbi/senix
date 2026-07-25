import Link from 'next/link';
import type { BlogPost, BlogTextPart } from './posts';
import { formatPostDate, parseBlogText } from './posts';

function BlogRichText({ text }: { text: string }): React.ReactElement {
  const parts = parseBlogText(text);
  return <>{parts.map((part, i) => renderPart(part, i))}</>;
}

function renderPart(part: BlogTextPart, key: number): React.ReactNode {
  if (part.type === 'text') return <span key={key}>{part.value}</span>;
  return (
    <Link key={key} href={part.href} className="blog-prose-link">
      {part.label}
    </Link>
  );
}

/**
 * Long-form blog article body: metadata header, sectioned content with
 * internal Senix links, and a bottom CTA. Content stays in posts.ts.
 */
export function BlogPostArticle({ post }: { post: BlogPost }): React.ReactElement {
  return (
    <article className="blog-prose trae-section max-w-3xl pb-20">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-[#8b8794] hover:text-white transition"
      >
        <span aria-hidden>←</span>
        All posts
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#8b8794]">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span aria-hidden className="text-[#8b8794]/50">
            ·
          </span>
          <span>{post.readingMinutes} min read</span>
          <span aria-hidden className="text-[#8b8794]/50">
            ·
          </span>
          <span>{post.author}</span>
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white leading-tight">
          {post.title}
        </h1>
        <p className="blog-prose-body mt-4 text-lg leading-relaxed">{post.description}</p>
      </header>

      <div className="mt-12 space-y-12">
        {post.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              {section.heading}
            </h2>
            <div className="blog-prose-body mt-4 space-y-4 text-[15px] sm:text-base leading-relaxed">
              {section.blocks.map((block, i) => {
                if (block.type === 'p') {
                  return (
                    <p key={i}>
                      <BlogRichText text={block.text} />
                    </p>
                  );
                }
                if (block.type === 'ul') {
                  return (
                    <ul key={i} className="list-disc space-y-2 pl-5 marker:text-[#32f08c]">
                      {block.items.map((item) => (
                        <li key={item} className="pl-1">
                          <BlogRichText text={item} />
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <ol key={i} className="list-decimal space-y-2 pl-5 marker:text-[#8b8794]">
                    {block.items.map((item) => (
                      <li key={item} className="pl-1">
                        <BlogRichText text={item} />
                      </li>
                    ))}
                  </ol>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-16 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-8 sm:px-8">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#32f08c]/80">
          Try Senix
        </p>
        <p className="mt-3 text-white leading-relaxed">
          Get a behavioral summary and risk level on every pull request. Free to start, no
          credit card.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/docs/installation"
            className="inline-flex items-center justify-center rounded-lg bg-[#32f08c] px-4 py-2.5 text-sm font-medium text-[#09080c] hover:bg-[#3ee1a3] transition"
          >
            Install on GitHub
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:border-white/40 transition"
          >
            View pricing
          </Link>
          <Link
            href="/docs/how-it-works"
            className="inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-[#8b8794] hover:text-white transition"
          >
            How it works
          </Link>
        </div>
      </aside>
    </article>
  );
}
