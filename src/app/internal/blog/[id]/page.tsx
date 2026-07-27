import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostById } from '@features/blog/posts';
import { PageHeader, Card, Badge, Button } from '../../ui';
import { setPostStatus, deletePost } from '../actions';
import PostEditor from './editor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Post editor page: the form plus publish/unpublish and delete controls.
 * Publishing makes the post live on /blog immediately — the public pages are
 * request-rendered, so no deploy is involved.
 */
export default async function InternalBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const isPublished = post.status === 'published';

  return (
    <>
      <PageHeader
        title="Edit post"
        subtitle={post.published_at ? `First published ${new Date(post.published_at).toLocaleDateString()}` : 'Not yet published'}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={isPublished ? 'green' : 'yellow'}>{post.status}</Badge>
            <Link
              href="/internal/blog"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary"
            >
              All posts
            </Link>
          </div>
        }
      />

      <Card className="mb-6">
        <PostEditor
          post={{
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content_md: post.content_md,
            cover_image_url: post.cover_image_url,
          }}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-primary">Publishing</h2>
        <p className="mb-4 text-xs text-muted">
          Save your changes first — publishing uses the last saved version. Published posts
          appear on /blog, in the sitemap, and in the RSS feed immediately.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <form action={setPostStatus}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="next_status" value={isPublished ? 'draft' : 'published'} />
            <Button type="submit" variant={isPublished ? 'secondary' : 'primary'}>
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </form>

          {isPublished && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary"
            >
              View live post
            </a>
          )}

          <form action={deletePost} className="ml-auto">
            <input type="hidden" name="id" value={post.id} />
            <Button type="submit" variant="danger">
              Delete
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
}
