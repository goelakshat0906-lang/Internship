"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutGrid, Radar, Sparkles, Kanban, BarChart3 } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Catalog", icon: LayoutGrid },
  { href: "/scout", label: "Scout Agent", icon: Radar },
  { href: "/studio", label: "AI Studio", icon: Sparkles },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink-700 bg-ink-900 px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-volt-400 text-ink-950 shadow-glow">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-ink-50">VoltScout</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-300">EE Career Portal</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-volt-400/15 text-volt-300 border border-volt-400/30"
                    : "text-ink-300 hover:bg-ink-700 hover:text-ink-100 border border-transparent",
                )}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-lg border border-ink-600 bg-ink-800 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-volt-400">Live Agent</p>
          <p className="mt-1 text-xs text-ink-300">
            Daily autonomous scan runs at <span className="text-ink-100">08:00 UTC</span>.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700 bg-ink-950/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt-400 text-ink-950">
              <Zap size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold">VoltScout</span>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-ink-700 bg-ink-950 px-3 py-2 md:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium",
                  active ? "bg-volt-400/15 text-volt-300" : "text-ink-300",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 bg-ink-950">{children}</main>
      </div>
    </div>
  );
}
