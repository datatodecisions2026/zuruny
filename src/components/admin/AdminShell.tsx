"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, ClipboardList, Package, BookOpen, Map, LogOut } from "lucide-react";
import { adminSignOut } from "@/lib/admin-auth-actions";

const ICONS = { LayoutDashboard, ClipboardList, Package, BookOpen, Map } as const;

export type AdminLink = { href: string; label: string; icon: keyof typeof ICONS };

/**
 * The sidebar below `lg` becomes a slide-in drawer behind a backdrop,
 * opened from a sticky mobile top bar — same shape as the storefront's own
 * MobileMenu, just for the back office. Above `lg` it's a fixed rail; there
 * is no separate "collapse to icons" mode, since five links never need one.
 */
export function AdminShell({
  email,
  links,
  children,
}: {
  email: string;
  links: AdminLink[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <header className="admin-dark sticky top-0 z-30 flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <span className="admin-display text-lg">Zuruny</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-md p-2 hover:bg-white/5"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`admin-sidebar admin-dark inset-y-0 left-0 z-50 flex shrink-0 flex-col justify-between px-4 py-6 transition-transform duration-300 ${
          open ? "" : "admin-drawer-closed"
        }`}
      >
        <div>
          <div className="mb-8 flex items-center justify-between px-2">
            <span className="admin-display text-lg">Zuruny</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-1 hover:bg-white/5 lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = ICONS[link.icon];
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm opacity-70 transition-[opacity,background-color] hover:bg-white/5 hover:opacity-100 ${
                    active ? "bg-white/10 opacity-100" : ""
                  }`}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="admin-mono truncate px-3 text-[0.65rem] opacity-50">{email}</p>
          <form action={adminSignOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm opacity-70 transition-[opacity,background-color] hover:bg-white/5 hover:opacity-100"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
