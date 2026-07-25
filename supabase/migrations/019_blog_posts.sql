-- Migration 019: blog posts
--
-- DB-backed blog so admins can write and publish from /internal/blog without
-- a deploy. Public pages (/blog, /blog/{slug}) render server-side with the
-- service role and filter to status = 'published'; drafts are never exposed.
--
-- RLS enabled with no policies (service-role only), same pattern as
-- admin_users / credit_packs. Run manually in Supabase.

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- URL segment: senix.dev/blog/{slug}
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  title TEXT NOT NULL,
  -- Meta description + list-card summary. Keep it under ~160 chars for SEO.
  excerpt TEXT,
  -- Markdown source, rendered to HTML at request time.
  content_md TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  author_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public list query: published posts, newest first.
CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON blog_posts (status, published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
-- No policies: reads and writes go through the service role only.
