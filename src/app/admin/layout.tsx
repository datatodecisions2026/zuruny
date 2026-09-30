import { getSessionAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminShell, type AdminLink } from "@/components/admin/AdminShell";
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

  const links: AdminLink[] = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/orders", label: "Orders", icon: "ClipboardList" },
    { href: "/admin/products", label: "Products", icon: "Package" },
    { href: "/admin/names", label: "Names", icon: "BookOpen" },
    { href: "/admin/map", label: "Map", icon: "Map" },
  ];

  return (
    <div className="admin-scope">
      <AdminShell email={admin.email} links={links}>
        {children}
      </AdminShell>
    </div>
  );
}

export const dynamic = "force-dynamic";
