import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDict, isLocale, localePath } from "@/lib/i18n";

/**
 * The owner's shell. Every /admin/* page renders inside this.
 *
 * This is the one gate: a page under /admin never needs to re-check
 * `isAdmin` itself, because nothing reaches its children without it. There is
 * no row-level security behind any of these queries any more, so this check
 * — not a database policy — is the actual boundary.
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

  const user = await getSessionUser();
  if (!user) redirect(localePath(locale, "/account"));

  if (!user.isAdmin) {
    return (
      <main id="main" className="min-h-[70svh] px-[var(--gutter)] pb-24 pt-40 sm:pt-36">
        <h1 className="u-display text-[length:var(--step-3)] text-cream">{t.admin.title}</h1>
        <p className="u-measure mt-6 text-[var(--text-muted)]">{t.admin.notAllowed}</p>
        <Link
          href={localePath(locale, "/account")}
          className="u-mono u-underline mt-8 inline-block text-ochre"
        >
          {t.account.title} &rarr;
        </Link>
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
          <p className="u-mono mt-3 text-[var(--text-faint)]">{user.email}</p>
        </div>
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
      </div>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";
