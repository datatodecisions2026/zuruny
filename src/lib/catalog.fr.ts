import type { Locale } from "@/lib/i18n";
import type { Product, SpecItem } from "@/lib/catalog";

/**
 * French product copy.
 *
 * Translations live on the product so the admin can edit them. This module is
 * only the resolver: it prefers the database value and falls back to English
 * rather than rendering an empty field.
 *
 * Deliberately absent: the `memory` fields. Those are the founder's own words
 * and are not translated by us. See the note in i18n.ts.
 */
export function descriptionFor(product: Product, locale: Locale): string {
  if (locale === "fr" && product.descriptionFr) return product.descriptionFr;
  return product.description;
}

export function specFor(product: Product, locale: Locale): SpecItem[] {
  if (locale !== "fr") return product.spec;
  return product.spec.map((s) => ({
    ...s,
    label: s.labelFr || s.label,
    value: s.valueFr || s.value,
  }));
}
