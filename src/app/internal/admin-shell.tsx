'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Users,
  GitPullRequest,
  PenSquare,
  Coins,
  Shield,
  ScrollText,
  MessageSquare,
  Wrench,
  Menu,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { label: 'Status', href: '/internal', icon: Activity },
  { label: 'Metrics', href: '/internal/metrics', icon: BarChart3 },
  { label: 'Users', href: '/internal/users', icon: Users },
  { label: 'Reviews', href: '/internal/reviews', icon: GitPullRequest },
  { label: 'Blog', href: '/internal/blog', icon: PenSquare },
  { label: 'Affiliates', href: '/internal/affiliates', icon: Coins },
  { label: 'Admins', href: '/internal/admins', icon: Shield },
  { label: 'Audit', href: '/internal/audit', icon: ScrollText },
  { label: 'Feedback', href: '/internal/feedback', icon: MessageSquare },
  { label: 'Test', href: '/internal/test', icon: Wrench },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/internal') return pathname === '/internal';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Persistent admin sidebar shell for every /internal/* page. Mirrors the
 * dashboard's icon-rail pattern (expand on hover, mobile drawer) and the app
 * token system. Rendered only after the layout's admin check passes, so it
 * never leaks to non-admins.
 */
export default function AdminShell({
  role,
  handle,
  children,
}: {
  role: string;
  handle: string;
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const labelHidden = expanded ? '' : 'md:hidden';

  const railItems = NAV.map((item) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setDrawerOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
          active
            ? 'bg-surface-raised text-primary'
            : 'text-secondary hover:bg-surface-raised hover:text-primary'
        } ${expanded ? '' : 'md:justify-center'}`}
      >
        <Icon size={18} strokeWidth={1.75} className="shrink-0" />
        <span className={labelHidden}>{item.label}</span>
      </Link>
    );
  });

  return (
    <div className="senix-app relative min-h-screen bg-base text-primary">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-surface-border bg-base/95 px-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin navigation"
          className="rounded-lg p-1.5 text-secondary hover:bg-surface-raised hover:text-primary"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold">Senix Admin</span>
      </div>

      {/* Desktop rail */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-surface-border bg-surface transition-[width] duration-200 md:flex ${
          expanded ? 'w-56' : 'w-16'
        }`}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <Shield size={20} className="shrink-0 text-accent" />
          <span className={`text-sm font-semibold ${labelHidden}`}>Senix Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 py-2">{railItems}</nav>
        <div className="border-t border-surface-border px-3 py-3">
          <div className={`truncate text-xs text-secondary ${labelHidden}`}>{handle}</div>
          <div className={`mt-0.5 text-[10px] uppercase tracking-wide text-accent ${labelHidden}`}>
            {role}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-surface-border bg-surface">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-sm font-semibold">Senix Admin</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-secondary hover:bg-surface-raised hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-2 py-2">{railItems}</nav>
            <div className="border-t border-surface-border px-4 py-3 text-xs text-secondary">
              {handle} · <span className="uppercase text-accent">{role}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-12 pt-20 md:ml-16 md:p-8 md:pt-8">
        <main className="mx-auto min-w-0 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
