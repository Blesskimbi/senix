'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@features/shared/supabase';
import { requireAdmin, recordAdminAction } from '@features/admin/admin-auth';
import { slugify, autoExcerpt } from '@features/blog/markdown';

/**
 * Blog authoring actions. Every action calls requireAdmin() independently —
 * the /internal layout gates page rendering but NOT server actions, which are
 * their own POST endpoints — and records an attributed audit row.
 */

export type EditorState = { message: string | null; error: string | null };

function isUniqueViolation(message: string): boolean {
  return /duplicate key|unique/i.test(message);
}

/** Refresh both the admin views and the public pages a change affects. */
function revalidateForSlug(slug: string | null): void {
  revalidatePath('/internal/blog');
  revalidatePath('/blog');
  if (slug) revalidatePath(`/blog/${slug}`);
}

/** Create an empty draft and jump straight into the editor. */
export async function createPost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const title = String(formData.get('title') ?? '').trim() || 'Untitled post';
  const base = slugify(title) || 'untitled';
  // Suffix on collision so a repeated title never blocks creation.
  const slug = `${base}-${Date.now().toString(36).slice(-4)}`;

  const { data, error } = (await supabaseAdmin
    .from('blog_posts')
    .insert({ title, slug, author_user_id: admin.userId, status: 'draft' })
    .select('id')
    .single()) as unknown as { data: { id: string } | null; error: { message: string } | null };

  if (error || !data) {
    console.error('[internal/blog] create failed', { message: error?.message });
    redirect('/internal/blog');
  }

  await recordAdminAction(admin.userId, 'create_blog_post', slug);
  revalidateForSlug(slug);
  redirect(`/internal/blog/${data.id}`);
}

/** Save editor changes (title, slug, excerpt, cover, body). */
export async function savePost(
  _prev: EditorState,
  formData: FormData
): Promise<EditorState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { message: null, error: 'Not authorized.' };
  }

  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const rawSlug = String(formData.get('slug') ?? '').trim();
  const contentMd = String(formData.get('content_md') ?? '');
  const coverImage = String(formData.get('cover_image_url') ?? '').trim();
  const excerptInput = String(formData.get('excerpt') ?? '').trim();

  if (!id) return { message: null, error: 'Missing post id.' };
  if (!title) return { message: null, error: 'Title is required.' };

  const slug = slugify(rawSlug || title);
  if (!slug) return { message: null, error: 'Slug must contain letters or numbers.' };

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .update({
      title,
      slug,
      content_md: contentMd,
      cover_image_url: coverImage || null,
      // Fall back to a derived summary so meta descriptions are never empty.
      excerpt: excerptInput || autoExcerpt(contentMd) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    if (isUniqueViolation(error.message)) {
      return { message: null, error: `The slug "${slug}" is already used by another post.` };
    }
    return { message: null, error: `Save failed: ${error.message}` };
  }

  await recordAdminAction(admin.userId, 'update_blog_post', slug);
  revalidateForSlug(slug);
  return { message: 'Saved.', error: null };
}

/** Publish or unpublish. Publishing stamps published_at the first time only. */
export async function setPostStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get('id') ?? '');
  const next = String(formData.get('next_status') ?? '');
  if (!id || (next !== 'published' && next !== 'draft')) return;

  const { data: existing } = (await supabaseAdmin
    .from('blog_posts')
    .select('slug, published_at')
    .eq('id', id)
    .maybeSingle()) as unknown as {
    data: { slug: string; published_at: string | null } | null;
  };
  if (!existing) return;

  const update: Record<string, unknown> = {
    status: next,
    updated_at: new Date().toISOString(),
  };
  // Keep the original publish date across unpublish/republish cycles.
  if (next === 'published' && !existing.published_at) {
    update.published_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin.from('blog_posts').update(update).eq('id', id);
  if (error) {
    console.error('[internal/blog] status change failed', { id, message: error.message });
    return;
  }

  await recordAdminAction(
    admin.userId,
    next === 'published' ? 'publish_blog_post' : 'unpublish_blog_post',
    existing.slug
  );
  revalidateForSlug(existing.slug);
}

export async function deletePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const { data: existing } = (await supabaseAdmin
    .from('blog_posts')
    .select('slug')
    .eq('id', id)
    .maybeSingle()) as unknown as { data: { slug: string } | null };

  const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
  if (error) {
    console.error('[internal/blog] delete failed', { id, message: error.message });
    return;
  }

  await recordAdminAction(admin.userId, 'delete_blog_post', existing?.slug ?? id);
  revalidateForSlug(existing?.slug ?? null);
  redirect('/internal/blog');
}
