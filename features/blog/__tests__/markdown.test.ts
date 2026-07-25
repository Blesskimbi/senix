import { describe, it, expect } from 'vitest';
import {
  renderMarkdown,
  slugify,
  autoExcerpt,
  readingTimeMinutes,
} from '@features/blog/markdown';

/**
 * Proves blog markdown rendering is safe and correct: raw HTML in a post is
 * ESCAPED rather than executed (a stored-XSS on a public marketing page is
 * the worst outcome of a compromised admin account), normal markdown still
 * renders, and slugs stay URL-safe.
 */

describe('renderMarkdown — XSS safety', () => {
  it('escapes a raw script tag instead of emitting it', () => {
    const html = renderMarkdown('Hello\n\n<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes inline HTML with event handlers', () => {
    const html = renderMarkdown('text <img src=x onerror="alert(1)"> more');
    expect(html).not.toContain('onerror="alert(1)"');
    expect(html).toContain('&lt;img');
  });

  it('escapes iframes', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('&lt;iframe');
  });
});

describe('renderMarkdown — normal markdown still works', () => {
  it('renders headings, bold, links, and lists', () => {
    const html = renderMarkdown(
      '## Heading\n\nSome **bold** and a [link](https://senix.dev).\n\n- one\n- two'
    );
    expect(html).toContain('<h2>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('href="https://senix.dev"');
    expect(html).toContain('<li>');
  });

  it('renders fenced code blocks with the content escaped by marked', () => {
    const html = renderMarkdown('```ts\nconst a = 1 < 2;\n```');
    expect(html).toContain('<pre>');
    expect(html).toContain('&lt; 2');
  });
});

describe('slugify', () => {
  it('produces URL-safe slugs', () => {
    expect(slugify('What We Learned Reviewing 10,000 PRs')).toBe(
      'what-we-learned-reviewing-10000-prs'
    );
    expect(slugify('  Spaced   out  ')).toBe('spaced-out');
    expect(slugify('Hello -- World!')).toBe('hello-world');
  });

  it('matches the slug CHECK constraint in migration 019', () => {
    const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    for (const title of ['Hello World', 'A/B testing 101', '  Trailing dashes -- ']) {
      const slug = slugify(title);
      expect(slug).toMatch(pattern);
    }
  });
});

describe('autoExcerpt', () => {
  it('strips markdown syntax and truncates', () => {
    const excerpt = autoExcerpt('# Title\n\nSome **bold** text with a [link](https://x.com).');
    expect(excerpt).not.toContain('**');
    expect(excerpt).not.toContain('#');
    expect(excerpt).toContain('link');
  });

  it('caps at the requested length', () => {
    const excerpt = autoExcerpt('word '.repeat(200), 50);
    expect(excerpt.length).toBeLessThanOrEqual(50);
  });
});

describe('readingTimeMinutes', () => {
  it('is at least 1 minute and scales with length', () => {
    expect(readingTimeMinutes('short')).toBe(1);
    expect(readingTimeMinutes('word '.repeat(600))).toBe(3);
  });
});
