import { Marked } from 'marked';

/**
 * Markdown -> HTML for blog posts.
 *
 * Raw HTML in the source is ESCAPED rather than passed through. Posts are
 * written by admins, but a stored-XSS on a public marketing page is exactly
 * the kind of thing a compromised admin account would reach for, and we lose
 * nothing by it: posts are authored in markdown, not HTML. marked escapes
 * code blocks itself, so fenced samples still render correctly.
 *
 * Pure JS, no Node APIs — safe in the Cloudflare Workers runtime.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const renderer = new Marked({ gfm: true, breaks: false });

renderer.use({
  renderer: {
    // Block-level and inline raw HTML both land here; emit escaped text.
    html({ text }: { text: string }): string {
      return escapeHtml(text);
    },
  },
});

/** Render post markdown to an HTML string. */
export function renderMarkdown(markdown: string): string {
  return renderer.parse(markdown ?? '', { async: false }) as string;
}

/** Rough reading time in minutes (200 wpm), floored at 1. */
export function readingTimeMinutes(markdown: string): number {
  const words = (markdown ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Build a URL-safe slug from a title. */
export function slugify(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Derive a plain-text excerpt from markdown when the author left the excerpt
 * blank — strips fences, markup, and collapses whitespace.
 */
export function autoExcerpt(markdown: string, maxLength = 160): string {
  const plain = (markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
}
