import Link from 'next/link';

/**
 * Shared presentational primitives for the /internal admin pages, built on the
 * app token system (bg-surface / text-primary / accent). Keeps every page
 * visually consistent without a component library.
 */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`rounded-xl border border-surface-border bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** A stat tile. When `href` is set the whole tile is a clickable drill-down. */
export function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}): React.ReactElement {
  const inner = (
    <>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary">{value}</div>
      {sub && <div className="mt-1 text-xs text-secondary">{sub}</div>}
      {href && <div className="mt-2 text-xs font-medium text-accent">View →</div>}
    </>
  );
  const base = 'rounded-xl border border-surface-border bg-surface p-5';
  if (href) {
    return (
      <Link
        href={href}
        className={`${base} block transition-colors duration-150 hover:border-neutral-border hover:bg-surface-raised`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

const BUTTON_VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-black hover:bg-accent-hover',
  secondary:
    'border border-surface-border bg-surface-raised text-primary hover:border-neutral-border',
  danger: 'border border-risk-high/40 bg-risk-high/10 text-risk-high hover:bg-risk-high/20',
};

export function Button({
  children,
  type = 'button',
  variant = 'secondary',
  disabled,
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 disabled:opacity-50 ${BUTTON_VARIANTS[variant]}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'green' | 'yellow' | 'red' | 'purple';
}): React.ReactElement {
  const tones: Record<string, string> = {
    neutral: 'border-surface-border bg-surface-raised text-secondary',
    green: 'border-risk-low/30 bg-risk-low/10 text-risk-low',
    yellow: 'border-risk-medium/30 bg-risk-medium/10 text-risk-medium',
    red: 'border-risk-high/30 bg-risk-high/10 text-risk-high',
    purple: 'border-accent/30 bg-accent/10 text-accent',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Simple table shell for admin lists. */
export function Table({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wide text-muted">{head}</thead>
        <tbody className="divide-y divide-surface-border">{children}</tbody>
      </table>
    </div>
  );
}
