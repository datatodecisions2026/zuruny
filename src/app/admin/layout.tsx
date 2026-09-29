import Link from "next/link";
import { LayoutDashboard, ClipboardList, Package, BookOpen, Map, LogOut } from "lucide-react";
import { getSessionAdmin } from "@/lib/admin-auth";
import { adminSignOut } from "@/lib/admin-auth-actions";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import "./admin.css";

/**
 * The owner's back office. Lives outside app/[locale]/ entirely — no
 * storefront header, footer or basket, its own light theme (admin.css),
 * its own sign-in (src/lib/admin-auth.ts), no locale.
 *
 * This is the one gate: a page under /admin never checks the admin session
 * itself, because nothing reaches its children without it.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getSessionAdmin();

  if (!admin) {
    return (
      <div className="admin-scope flex min-h-svh items-center justify-center p-6">
        <AdminLoginForm />
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/names", label: "Names", icon: BookOpen },
    { href: "/admin/map", label: "Map", icon: Map },
  ];

  return (
    <div className="admin-scope flex min-h-svh">
      <aside className="flex w-56 shrink-0 flex-col justify-between bg-sidebar px-4 py-6 text-sidebar-foreground">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <span className="admin-display text-lg">Zuruny</span>
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="admin-mono truncate px-3 text-[0.65rem] text-sidebar-foreground/50">{admin.email}</p>
          <form action={adminSignOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-8">{children}</main>
    </div>
  );
}

export const dynamic = "force-dynamic";
