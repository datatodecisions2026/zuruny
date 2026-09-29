import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionAdmin } from "@/lib/admin-auth";
import { adminSignOut } from "@/lib/admin-auth-actions";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getDict, isLocale, localePath } from "@/lib/i18n";

/**
 * The owner's shell. Every /admin/* page renders inside this.
 *
 * This is the one gate: a page under /admin never needs to check the admin
 * session itself, because nothing reaches its children without it. /admin is
 * its own sign-in — entirely separate from the customer /account flow, with
 * its own cookie and its own table (src/lib/admin-auth.ts) — so there is no
 * "signed in as a customer but not an admin" state to handle here at all.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  const admin = await getSessionAdmin();

  if (!admin) {
    return (
      <main id="main" className="min-h-[70svh] px-[var(--gutter)] pb-24 pt-40 sm:pt-36">
        <h1 className="m-intro-item u-display mb-10 text-[length:var(--step-3)] text-cream">
          {t.admin.title}
        </h1>
        <AdminLoginForm />
      </main>
    );
  }

  const links = [
    { href: "/admin", label: t.admin.orders },
    { href: "/admin/products", label: t.admin.products },
    { href: "/admin/names", label: "Names" },
    { href: "/admin/map", label: "Map" },
  ];

  return (
    <div id="main" className="min-h-[70svh] px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-40 sm:pt-36">
      <div className="mb-12 flex flex-wrap items-baseline justify-between gap-6 border-b border-[var(--rule)] pb-8">
        <div>
          <h1 className="u-display text-[length:var(--step-3)] text-cream">{t.admin.title}</h1>
          <p className="u-mono mt-3 text-[var(--text-faint)]">{admin.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label={t.admin.title} className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={localePath(locale, link.href)}
                className="u-mono border border-[var(--rule-strong)] px-5 py-3 text-[var(--text-muted)] transition-colors duration-300 hover:border-ochre hover:text-ochre"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action={adminSignOut}>
            <button
              type="submit"
              className="u-mono border border-[var(--rule-strong)] px-5 py-3 text-[var(--text-muted)] transition-colors duration-300 hover:border-ochre hover:text-ochre"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";
