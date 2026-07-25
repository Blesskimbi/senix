import { supabaseAdmin } from '@features/shared/supabase';

/**
 * Blog post queries (migration 019).
 *
 * Public pages call the `published` helpers, which filter to
 * status = 'published' at the query level — drafts can never leak through a
 * public route even if a slug is guessed. Admin pages use listAllPosts /
 * getPostById behind the /internal admin gate.
 */

export type PostStatus = 'draft' | 'published';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_image_url: string | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  users: { github_username: string | null; email: string | null } | null;
};

/** Columns shared by list views (no body, keeps list payloads small). */
const LIST_COLUMNS =
  'id, slug, title, excerpt, cover_image_url, status, published_at, created_at, updated_at, users:author_user_id(github_username, email)';

const FULL_COLUMNS = `${LIST_COLUMNS}, content_md`;

/** Published posts, newest first — the public /blog index and RSS feed. */
export async function listPublishedPosts(limit = 50): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select(LIST_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[blog] failed to list published posts', { message: error.message });
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

/** One published post by slug, or null (drafts and unknown slugs both 404). */
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select(FULL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('[blog] failed to load post', { slug, message: error.message });
    return null;
  }
  return (data ?? null) as unknown as BlogPost | null;
}

/** Every post including drafts — admin views only. */
export async function listAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select(LIST_COLUMNS)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[blog] failed to list posts', { message: error.message });
    return [];
  }
  return (data ?? []) as unknown as BlogPost[];
}

/** One post by id regardless of status — admin editor. */
export async function getPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select(FULL_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[blog] failed to load post by id', { id, message: error.message });
    return null;
  }
  return (data ?? null) as unknown as BlogPost | null;
}

/** Display name for a post's author. */
export function authorName(post: Pick<BlogPost, 'users'>): string {
  return post.users?.github_username ?? post.users?.email ?? 'Senix';
}

/** The date a post should show publicly. */
export function postDate(post: Pick<BlogPost, 'published_at' | 'created_at'>): string {
  return post.published_at ?? post.created_at;
}
