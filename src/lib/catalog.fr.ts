import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/catalog";

/**
 * French product copy, kept beside the catalogue rather than inside it so the
 * source of truth for stock, prices and photography stays one flat list.
 *
 * Deliberately absent: the `memory` fields. Those are the founder's own words
 * and are not translated by us. See the note in i18n.ts.
 */

type Translation = {
  description: string;
  spec?: { label: string; value: string }[];
};

const FR: Record<string, Translation> = {
  malvina: {
    description:
      "Au Liban-Sud, Deir Mimas se déploie parmi des collines plantées d'oliviers, dont certains sont centenaires. De la famille Hasbani.",
    spec: [
      { label: "Village", value: "Deir Mimas, Liban-Sud" },
      { label: "Famille", value: "Hasbani" },
      { label: "Récolte", value: "Fin septembre – octobre" },
      { label: "Acidité", value: "< 0,5 %" },
    ],
  },
  "em-ramiz": {
    description:
      "Dominant l'antique cité phénicienne de Sidon, Aabra s'étend entre la Méditerranée et les collines du Liban-Sud. De la famille Mushantaf, qui cultive l'olivier depuis deux générations.",
    spec: [
      { label: "Village", value: "Aabra, Liban-Sud" },
      { label: "Famille", value: "Mushantaf, 2ᵉ génération" },
      { label: "Récolte", value: "Précoce" },
      { label: "Acidité", value: "< 0,5 %" },
    ],
  },
  "georges-br-carob-molasses": {
    description:
      "Élaborée à partir de caroubes soigneusement sélectionnées, notre mélasse de caroube est un sirop méditerranéen traditionnel, naturellement sucré, à la texture onctueuse. Sans sucre ajouté, sans conservateurs, sans ingrédients artificiels.",
    spec: [
      { label: "Élaborée à partir de", value: "Caroubes" },
      { label: "Sucre ajouté", value: "Aucun" },
      { label: "Conservateurs", value: "Aucun" },
    ],
  },
  "fayez-for-caroub-molasse": {
    description:
      "Élaborée à partir de raisins soigneusement sélectionnés, selon des méthodes traditionnelles qui préservent sa richesse et sa douceur naturelle.",
    spec: [
      { label: "Élaborée à partir de", value: "Raisins" },
      { label: "Méthode", value: "Réduction traditionnelle" },
      { label: "Sucre ajouté", value: "Aucun" },
    ],
  },
  tantour: {
    description:
      "Affirmée et indépendante. Inspirée des princesses libanaises qui portaient le tantour, elle incarne la loyauté, la force et l'élégance dans chacune de ses courbes.",
    spec: [{ label: "Matière", value: "Céramique émaillée" }],
  },
  "bri2-zeit": {
    description:
      "Inspirée de la tradition, la forme Bri' évoque le vieux dicton libanais selon lequel l'histoire se répète. Un contenant pour vos rituels quotidiens.",
    spec: [{ label: "Matière", value: "Céramique émaillée" }],
  },
  costers: {
    description:
      "Plus qu'un dessous-de-verre. Un morceau du Liban, où que vous soyez. Taillé dans du véritable cèdre du Liban.",
    spec: [{ label: "Matière", value: "Cèdre du Liban" }],
  },
  najibe: {
    description:
      "Perché dans les montagnes du Liban-Nord, Douma est un village où le paysage et le patrimoine sont intimement liés. De la famille Chalhoub, trois générations durant.",
    spec: [
      { label: "Village", value: "Douma, Liban-Nord" },
      { label: "Famille", value: "Chalhoub, 3ᵉ génération" },
      { label: "Récolte", value: "Novembre" },
      { label: "Acidité", value: "< 0,5 %" },
    ],
  },
  nazira: { description: "Bientôt disponible" },
  "mimi-olive-oil": { description: "Bientôt disponible" },
};

export function descriptionFor(product: Product, locale: Locale): string {
  if (locale === "fr") {
    const t = FR[product.handle];
    if (t) return t.description;
  }
  return product.description;
}

export function specFor(
  product: Product,
  locale: Locale,
): { label: string; value: string }[] {
  if (locale === "fr") {
    const t = FR[product.handle];
    if (t?.spec) return t.spec;
  }
  return product.spec;
}
