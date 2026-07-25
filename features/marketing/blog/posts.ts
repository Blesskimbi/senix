/**
 * Typed blog post registry. Add new posts here; the index, slug route,
 * and sitemap all read from this list. No MDX or CMS.
 *
 * Inline links use markdown-style [label](/path) inside paragraph and
 * list strings. Only internal paths (starting with /) are rendered as
 * links; everything else stays plain text.
 */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

export type BlogSection = {
  id: string;
  heading: string;
  blocks: BlogBlock[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  keywords: string[];
  readingMinutes: number;
  sections: BlogSection[];
};

export type BlogTextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; href: string; label: string };

const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

/** Split a string into plain text and internal link parts. */
export function parseBlogText(input: string): BlogTextPart[] {
  const parts: BlogTextPart[] = [];
  let last = 0;
  for (const match of input.matchAll(LINK_RE)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push({ type: 'text', value: input.slice(last, index) });
    }
    parts.push({ type: 'link', href: match[2], label: match[1] });
    last = index + match[0].length;
  }
  if (last < input.length) {
    parts.push({ type: 'text', value: input.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: 'text', value: input }];
}

const POSTS: BlogPost[] = [
  {
    slug: 'why-ai-pr-review-matters-with-cursor-copilot-claude-code',
    title:
      'Why AI PR Review Matters When Shipping with Cursor, Copilot, and Claude Code',
    description:
      'AI coding tools ship larger PRs faster than humans can review. Here is why automated PR review focused on behavior and risk matters for Cursor, Copilot, and Claude Code teams.',
    publishedAt: '2026-07-25',
    author: 'Senix',
    keywords: [
      'AI PR review',
      'AI code review',
      'Cursor',
      'GitHub Copilot',
      'Claude Code',
      'pull request risk',
      'automated code review',
    ],
    readingMinutes: 7,
    sections: [
      {
        id: 'the-new-default',
        heading: 'AI coding is the new default. Review has not caught up.',
        blocks: [
          {
            type: 'p',
            text: 'Teams using Cursor, GitHub Copilot, and Claude Code are writing more code, in more files, with fewer keystrokes. That is the point. A feature that used to take a week can land as a pull request the same afternoon.',
          },
          {
            type: 'p',
            text: 'The bottleneck moved. It is no longer "can we produce the change?" It is "can a human actually understand what this PR does before it merges?" Diff size went up. Context across files went up. The time reviewers have did not.',
          },
          {
            type: 'p',
            text: 'If your review process still assumes a developer hand-wrote every line while thinking carefully about auth, validation, and side effects, you are reviewing yesterday\'s workflow with yesterday\'s assumptions. [Senix](/) exists for the new one: every PR gets a behavioral risk pass before merge.',
          },
        ],
      },
      {
        id: 'what-breaks',
        heading: 'What actually breaks in AI-assisted PRs',
        blocks: [
          {
            type: 'p',
            text: 'AI assistants are strong at local correctness and weak at repository intent. The failure modes that matter in production are rarely a missing semicolon. They look like the kinds of issues called out in Senix\'s [risk flags](/docs/risk-flags):',
          },
          {
            type: 'ul',
            items: [
              'An auth check that used to wrap a route is "simplified" away during a refactor.',
              'A query is rewritten with string concatenation where a parameterized call used to live.',
              'A secret that lived in an env var is inlined "temporarily" so the demo works.',
              'Input validation is dropped because the model regenerated a handler from an outdated example.',
              'Payment or subscription logic changes in a way that is correct for the happy path and wrong for refunds, trials, or failed charges.',
              'A new external API call appears without timeout, retry, or error handling the rest of the codebase expects.',
            ],
          },
          {
            type: 'p',
            text: 'None of these show up as a red squiggle in the editor. They show up as incidents after merge. Line-by-line style nits do not catch them. A reviewer who only skims for "does this look like TypeScript" will not catch them either.',
          },
        ],
      },
      {
        id: 'what-good-review-looks-like',
        heading: 'What a useful review looks like now',
        blocks: [
          {
            type: 'p',
            text: 'When PRs are larger and more AI-authored, the review that helps is not a thousand comments about naming. It is a short answer to three questions:',
          },
          {
            type: 'ol',
            items: [
              'What did this change actually do to system behavior?',
              'How risky is it, in plain language?',
              'Which files and concerns deserve a human\'s limited attention?',
            ],
          },
          {
            type: 'p',
            text: 'That is behavioral review. It trades exhaustive nitpicking for signal. A senior engineer still makes the merge decision. They just start from a map instead of a wall of green and red lines. [How Senix works](/docs/how-it-works) walks through that pipeline end to end.',
          },
        ],
      },
      {
        id: 'human-review-still-wins',
        heading: 'Humans still own the merge. Automation owns the triage.',
        blocks: [
          {
            type: 'p',
            text: 'Automated review does not replace judgment. It replaces the expensive first pass: reading the whole diff cold, reconstructing intent, and guessing where the danger is.',
          },
          {
            type: 'p',
            text: 'For Cursor and Claude Code users, that first pass can also happen before the PR exists. With [Senix MCP](/docs/mcp) inside the IDE, you can ask "what did I just change, and what should I double-check?" before you push. The same questions apply on GitHub after the PR opens for teammates who never saw the agent session.',
          },
          {
            type: 'p',
            text: 'The goal is consistent triage. Every PR gets the same risk lens, not only the ones a tired reviewer happens to open carefully on a Tuesday.',
          },
        ],
      },
      {
        id: 'how-senix-fits',
        heading: 'How Senix fits',
        blocks: [
          {
            type: 'p',
            text: '[Senix](/) is a GitHub App built for this workflow. On every open or update, it reads the diff, builds a structural summary of what changed, and posts a short behavioral summary with an overall risk level and the files reviewers should focus on. The comment updates on re-pushes so the thread stays clean. See the [installation guide](/docs/installation) to connect a repo in a few minutes.',
          },
          {
            type: 'p',
            text: 'It is intentionally not a line-by-line nit bot. The product bet is simple: teams shipping with AI assistants need fast risk signal more than they need another round of style comments. The same review runs from Cursor, Claude Code, and other MCP-compatible editors before the PR lands. [Pricing](/pricing) starts free, with higher token budgets on paid plans when volume grows.',
          },
          {
            type: 'p',
            text: 'For setup details, configuration, and common questions, start at the [docs](/docs) or the [FAQ](/docs/faq).',
          },
        ],
      },
      {
        id: 'practical-habits',
        heading: 'Practical habits for AI-heavy teams',
        blocks: [
          {
            type: 'ul',
            items: [
              'Treat every AI-assisted PR as untrusted until behavior and risk are clear, even when the author is a strong engineer.',
              'Require a risk summary (human or automated) before merge on auth, payments, data access, and secrets-adjacent changes. Senix\'s [risk flags](/docs/risk-flags) are a concrete checklist for those surfaces.',
              'Review the high-signal files first, not the largest files first.',
              'Keep PR descriptions honest about what the agent changed versus what you intended. Intent gaps are where bugs hide.',
              'Run a pre-push review from the IDE when the agent touched many files. [MCP setup](/docs/mcp) makes that a one-prompt habit before GitHub.',
            ],
          },
        ],
      },
      {
        id: 'bottom-line',
        heading: 'Bottom line',
        blocks: [
          {
            type: 'p',
            text: 'Cursor, Copilot, and Claude Code made writing code cheaper. They did not make merging code safer by default. The teams that keep velocity without raising incident rate will treat PR review as a risk and behavior problem, not a formatting problem.',
          },
          {
            type: 'p',
            text: 'Automated AI PR review is how you keep that lens on every change, including the ones that look fine in the editor and are wrong in production. [Install Senix](/docs/installation), open a PR, and see the behavioral summary land as a comment.',
          },
        ],
      },
    ],
  },
];

/** All published posts, newest first. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getPostSlugs(): string[] {
  return POSTS.map((p) => p.slug);
}

/** Display date like "July 25, 2026". */
export function formatPostDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
