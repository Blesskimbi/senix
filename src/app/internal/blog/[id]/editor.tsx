'use client';

import { useActionState, useState } from 'react';
import { savePost, type EditorState } from '../actions';
import { slugify } from '@features/blog/markdown';

const INITIAL: EditorState = { message: null, error: null };

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_image_url: string | null;
};

/**
 * Post editor form. Markdown is authored in a plain textarea (no editor
 * dependency); the slug auto-fills from the title until the author edits it
 * by hand, so URLs stay clean without extra work.
 */
export default function PostEditor({ post }: { post: Post }): React.ReactElement {
  const [state, formAction, pending] = useActionState(savePost, INITIAL);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(true);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={post.id} />

      <Field label="Title">
        <input
          name="title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className={inputClass}
        />
      </Field>

      <Field label="Slug" hint={`senix.dev/blog/${slug || '…'}`}>
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={inputClass}
        />
      </Field>

      <Field label="Excerpt" hint="Meta description + list card. Left blank, we derive one.">
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={post.excerpt ?? ''}
          maxLength={300}
          className={inputClass}
        />
      </Field>

      <Field label="Cover image URL" hint="Optional. Shown at the top of the post and in social cards.">
        <input
          name="cover_image_url"
          defaultValue={post.cover_image_url ?? ''}
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <Field label="Body (Markdown)" hint="Headings, lists, links, code fences, tables. Raw HTML is escaped.">
        <textarea
          name="content_md"
          rows={22}
          defaultValue={post.content_md}
          className={`${inputClass} font-mono text-[13px] leading-relaxed`}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {state.message && <span className="text-sm text-risk-low">{state.message}</span>}
        {state.error && <span className="text-sm text-risk-high">{state.error}</span>}
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-primary outline-none focus:border-accent';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
