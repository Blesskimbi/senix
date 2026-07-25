import Link from 'next/link';
import { listAllPosts, authorName } from '@features/blog/posts';
import { PageHeader, Card, Table, Badge, Button } from '../ui';
import { createPost } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Admin blog index: every post, drafts included, newest-edited first.
 * Creating a post drops straight into the editor with a draft row.
 */
export default async function InternalBlogPage(): Promise<React.ReactElement> {
  const posts = await listAllPosts();
  const published = posts.filter((p) => p.status === 'published').length;

  return (
    <>
      <PageHeader
        title="Blog"
        subtitle={`${posts.length} post${posts.length === 1 ? '' : 's'} · ${published} published`}
      />

      <Card className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-primary">New post</h2>
        <form action={createPost} className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[260px] flex-1 flex-col gap-1 text-xs text-secondary">
            title
            <input
              name="title"
              required
              placeholder="What we learned reviewing 10,000 PRs"
              className="rounded-lg border border-surface-border bg-surface-raised px-2 py-1.5 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" variant="primary">
            Create draft
          </Button>
        </form>
      </Card>

      <Table
        head={
          <tr>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Slug</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Author</th>
            <th className="px-4 py-2">Updated</th>
            <th className="px-4 py-2" />
          </tr>
        }
      >
        {posts.map((post) => (
          <tr key={post.id} className="text-secondary">
            <td className="px-4 py-2 text-primary">{post.title}</td>
            <td className="px-4 py-2 text-accent">/blog/{post.slug}</td>
            <td className="px-4 py-2">
              <Badge tone={post.status === 'published' ? 'green' : 'yellow'}>{post.status}</Badge>
            </td>
            <td className="px-4 py-2">{authorName(post)}</td>
            <td className="px-4 py-2 text-muted">
              {new Date(post.updated_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/internal/blog/${post.id}`}
                  className="rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-neutral-border"
                >
                  Edit
                </Link>
                {post.status === 'published' && (
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-secondary transition-colors hover:text-primary"
                  >
                    View
                  </a>
                )}
              </div>
            </td>
          </tr>
        ))}
        {posts.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-muted">
              No posts yet — create your first above.
            </td>
          </tr>
        )}
      </Table>
    </>
  );
}
