import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { listProducts, backendName } from "@/lib/store";
import { isSignedIn, passwordConfigured } from "@/lib/admin-auth";
import { createProduct, login, logout } from "./actions";
import { ActionForm, Field, Select, Submit } from "@/components/admin/Ui";
import { money } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catalogue — Zuruny",
  robots: "noindex",
};
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isSignedIn())) {
    return (
      <div className="mx-auto max-w-sm px-6 py-28">
        <h1 className="u-display text-3xl text-char">Zuruny catalogue</h1>
        <ActionForm action={login} className="mt-8 space-y-5">
          <Field label="Password" name="password" type="password" />
          <Submit>Sign in</Submit>
        </ActionForm>
      </div>
    );
  }

  const rows = await listProducts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="u-display text-[clamp(2rem,5vw,3rem)] text-char">
          Catalogue
        </h1>
        <div className="flex items-center gap-5">
          <Link
            href="/shop"
            className="text-sm tracking-[0.12em] text-bronze underline decoration-bronze/30 underline-offset-8 hover:text-char"
          >
            View shop
          </Link>
          {passwordConfigured() ? (
            <form action={logout}>
              <button className="text-sm tracking-[0.12em] text-char-soft hover:text-char">
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p className="u-measure mt-4 text-char/75">
        {rows.length} products. Only <strong>active</strong> ones appear on the
        site; drafts stay hidden.
      </p>
      <p className="u-spec mt-2 text-char-soft">
        Storing in: {backendName()}
        {passwordConfigured() ? "" : " · no password set, so this page is open"}
      </p>

      <div className="u-rule my-8" />

      <ul className="space-y-3">
        {rows.map((p) => {
          const prices = p.variants.map((v) => v.price_cents);
          const low = prices.length ? Math.min(...prices) : 0;
          const stock = p.variants.reduce((n, v) => n + v.inventory, 0);
          return (
            <li key={p.id}>
              <Link
                href={`/admin/${p.handle}`}
                className="flex items-center gap-4 border border-bronze/20 bg-card px-4 py-3 transition-colors hover:border-bronze/50"
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-paper-deep">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="u-display text-lg text-char">{p.title}</p>
                  <p className="u-spec text-char-soft">
                    {p.kind} · {p.variants.length} variant
                    {p.variants.length === 1 ? "" : "s"} · {stock} in stock
                  </p>
                </div>
                <span className="u-spec text-char">
                  {low > 0 ? money(low) : "no price"}
                </span>
                <span
                  className={`u-spec ml-4 border px-2 py-1 ${
                    p.status === "active"
                      ? "border-bronze/40 text-bronze"
                      : "border-char/20 text-char-soft"
                  }`}
                >
                  {p.status}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="u-rule my-10" />

      <h2 className="u-display text-xl text-char">Add a product</h2>
      <ActionForm action={createProduct} className="mt-5 max-w-lg space-y-5">
        <Field label="Name" name="title" placeholder="Teta Nazira" />
        <Field
          label="Web address"
          name="handle"
          placeholder="leave blank to build it from the name"
          hint="Becomes /products/…"
        />
        <Select
          label="Kind"
          name="kind"
          options={[
            "Olive oil",
            "Carob molasses",
            "Grape molasses",
            "Carafe",
            "Coaster",
          ]}
        />
        <Submit>Create as draft</Submit>
      </ActionForm>
    </div>
  );
}
