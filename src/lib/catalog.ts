/**
 * The Zuruny catalogue.
 *
 * Rules this file exists to enforce (see zuruny-kit/README.txt):
 *   - Money is stored in integer cents. Never a float.
 *   - `priceCents: null` means no price has been set. Such a product can
 *     never show a working "add to cart".
 *   - `status: "draft"` products are not rendered on the site at all.
 *   - `images: []` is a real, honest gap. Do not substitute a stock photo.
 *   - The `memory` field is the founder's own writing, reproduced verbatim.
 *     Do not rewrite it, shorten it, or turn it into a slogan.
 *   - `namedAfterFrom` (where the person is from) and `spec.village` (where
 *     the oil is pressed) are DIFFERENT places. Never conflate them.
 */

export type ProductKind =
  | "olive-oil"
  | "carob-molasses"
  | "grape-molasses"
  | "carafe"
  | "coaster";

export type Variant = {
  label: string | null;
  priceCents: number | null;
  stock: number;
  available: boolean;
};

export type ProductImage = { src: string; w: number; h: number; alt: string };

export type SpecItem = {
  label: string;
  value: string;
  /* French is optional per field: an admin may translate the description and
     leave the spec, and the site should fall back rather than show blanks. */
  labelFr?: string;
  valueFr?: string;
};

export type Product = {
  handle: string;
  name: string;
  kind: ProductKind;
  status: "active" | "draft";
  namedAfterFrom?: string;
  description: string;
  descriptionFr?: string;
  /* The founder's own words. Never machine-translated, so there is no French
     counterpart — see the note in i18n.ts. */
  memory?: string;
  pullQuote?: string;
  spec: SpecItem[];
  images: ProductImage[];
  variants: Variant[];
};

export const products: Product[] = [
  {
    handle: "malvina",
    name: "Malvina",
    kind: "olive-oil",
    status: "active",
    namedAfterFrom: "Deir Mimas",
    description:
      "In South Lebanon, Deir Mimas unfolds among rolling hills lined with olive trees, some of which have stood for centuries. From the Hasbani family.",
    memory:
      "I chose to honor my grandfather's mother because although I never had the chance to know him, I wanted to pay tribute to him. And what better way than celebrating the woman who gave him life? Whenever I ask about her, her presence still resonates through the memories of my father and my teta. She had the kind of energy you simply don't forget, someone who is still very much alive in the memories of those who loved her, and whose legacy somehow lives on in me.",
    pullQuote: "She had the kind of energy you simply don't forget.",
    spec: [
      { label: "Village", value: "Deir Mimas, South Lebanon" },
      { label: "Family", value: "Hasbani" },
      { label: "Harvest", value: "Late September – October" },
      { label: "Acidity", value: "< 0.5%" },
    ],
    images: [
      {
        src: "/products/malvina-2.png",
        w: 1086,
        h: 1448,
        alt: "Malvina olive oil tins grouped on a black ground",
      },
      {
        src: "/products/malvina-1.png",
        w: 1023,
        h: 1538,
        alt: "A Malvina tin styled with a tantour carafe and a vintage family photograph",
      },
    ],
    variants: [{ label: null, priceCents: 2800, stock: 12, available: true }],
  },
  {
    handle: "em-ramiz",
    name: "Em Ramiz",
    kind: "olive-oil",
    status: "active",
    namedAfterFrom: "Machghara",
    description:
      "Overlooking the ancient Phoenician city of Sidon, Aabra sits between the Mediterranean and the hills of South Lebanon. From the Mushantaf family, who have cultivated olive trees for two generations.",
    memory:
      "I decided to honor my grandmother's lineage because she looks so much like her mother. Since we were children, we have always visited them, or they have visited us. Their mother's name was Alice. Amale is my teta. Ramiz would always come to play cards with us and bring us chocolate. Sophie is the one who is always there to help everyone — you have a new baby? She is already on a plane. Afaf, the youngest, is always laughing, and oh God, I love her macaroni dish. Since the creation of Skype they have spoken every single day, at the same hour, one calling the other. My teta always knows who is calling without even looking at her screen.",
    pullQuote:
      "My teta always knows who is calling without even looking at her screen.",
    spec: [
      { label: "Village", value: "Aabra, South Lebanon" },
      { label: "Family", value: "Mushantaf, 2nd generation" },
      { label: "Harvest", value: "Early" },
      { label: "Acidity", value: "< 0.5%" },
    ],
    images: [
      {
        src: "/products/em-ramiz-1.png",
        w: 1402,
        h: 1122,
        alt: "Three Em Ramiz tins on a deep red ground",
      },
    ],
    variants: [{ label: null, priceCents: 1000, stock: 0, available: false }],
  },
  {
    handle: "georges-br-carob-molasses",
    name: "Georges",
    kind: "carob-molasses",
    status: "active",
    namedAfterFrom: "Beirut",
    description:
      "Crafted from carefully selected carob pods, our Carob Molasses is a traditional Mediterranean syrup with a rich, naturally sweet flavor and a smooth texture. Made without added sugar, preservatives, or artificial ingredients.",
    memory:
      'I never had the chance to know him, yet he has always been a part of my life. When I was younger, every summer we would visit his grave and pray. It’s strange to pray and speak to someone you never knew — you have never heard the sound of his voice, his laugh, or even known his smell. Yet somehow we know him through the endless stories my grandmother tells, through the pictures I would find during family visits. "Here’s your jeddo." He is mine without ever truly being mine. Whenever I am asked, "If you could interview one person, dead or alive, who would it be?", my answer is always the same: him.',
    pullQuote: "He is mine without ever truly being mine.",
    spec: [
      { label: "Made from", value: "Carob pods" },
      { label: "Added sugar", value: "None" },
      { label: "Preservatives", value: "None" },
    ],
    images: [],
    variants: [{ label: null, priceCents: 1500, stock: 0, available: false }],
  },
  {
    handle: "fayez-for-caroub-molasse",
    name: "Fayez",
    kind: "grape-molasses",
    status: "active",
    namedAfterFrom: "Lebanon",
    description:
      "Made from carefully selected grapes, crafted using traditional methods to preserve its rich flavor and natural sweetness.",
    memory:
      'I had the chance to know him, but not enough, and that has always been my greatest regret. In the videos we were always together, always happy, and he was always so proud of me. He never failed to make me smile, especially when he would put 2 kg of walnuts picked directly from the tree into my suitcase because he knew how much I loved them. I will never forget the day I found a huge sunflower and brought it to him. He looked at me, told me the name of the flower and called me "the chamess." Since that day, the sunflower has been my favourite flower.',
    pullQuote:
      "He called me “the chamess.” Since that day, the sunflower has been my favourite flower.",
    spec: [
      { label: "Made from", value: "Grapes" },
      { label: "Method", value: "Traditional reduction" },
      { label: "Added sugar", value: "None" },
    ],
    images: [],
    variants: [{ label: null, priceCents: 1000, stock: 10, available: true }],
  },
  {
    handle: "tantour",
    name: "Tantour",
    kind: "carafe",
    status: "active",
    description:
      "Bold and independent. Inspired by the Lebanese princesses who wore tantours, it embodies loyalty, strength, and elegance in every curve.",
    spec: [{ label: "Material", value: "Glazed ceramic" }],
    // tantour-1 leads: tantour-3's dominant object is a Malvina oil tin, which
    // reads as the wrong product on a Tantour card.
    images: [
      {
        src: "/products/tantour-1.png",
        w: 1531,
        h: 1027,
        alt: "A row of tantour carafes in different glazes",
      },
      {
        src: "/products/tantour-3.png",
        w: 1023,
        h: 1537,
        alt: "A single tantour carafe beside a Malvina tin",
      },
      {
        src: "/products/tantour-2.png",
        w: 1402,
        h: 1122,
        alt: "A tantour carafe with fruit and lace in warm light",
      },
    ],
    variants: [{ label: null, priceCents: 7500, stock: 10, available: true }],
  },
  {
    handle: "bri2-zeit",
    name: "Bri' Zeit",
    kind: "carafe",
    status: "active",
    description:
      "Inspired by tradition, the Bri' shape evokes the old Lebanese saying that history repeats itself. A vessel for your everyday rituals.",
    spec: [{ label: "Material", value: "Glazed ceramic" }],
    // The pour (bri2-zeit-3) is the hero image, so the card leads with a
    // different shot rather than repeating it on the same page.
    images: [
      {
        src: "/products/bri2-zeit-2.png",
        w: 1023,
        h: 1537,
        alt: "The Bri' Zeit carafe with grapes and lace in warm golden light",
      },
      {
        src: "/products/bri2-zeit-1.png",
        w: 1537,
        h: 1023,
        alt: "The Bri' Zeit carafe on a wooden slab against black",
      },
      {
        src: "/products/bri2-zeit-3.png",
        w: 1021,
        h: 1541,
        alt: "Oil poured from the Bri' Zeit carafe into a coupe glass on an oxblood ground",
      },
    ],
    variants: [{ label: null, priceCents: 6500, stock: 10, available: true }],
  },
  {
    handle: "costers",
    name: "Coaster",
    kind: "coaster",
    status: "active",
    description:
      "More than a coaster. A piece of Lebanon, wherever you are. Made from authentic Lebanese cedar.",
    spec: [{ label: "Material", value: "Lebanese cedar" }],
    images: [
      {
        src: "/products/costers-1.png",
        w: 943,
        h: 1668,
        alt: "The quatrefoil coaster carved from Lebanese cedar on a near-black ground",
      },
    ],
    variants: [{ label: null, priceCents: 1000, stock: 10, available: true }],
  },

  // --- Not in production. status "draft" keeps these out of every view. ---
  {
    handle: "najibe",
    name: "Najibe",
    kind: "olive-oil",
    status: "draft",
    namedAfterFrom: "Zghorta",
    description:
      "Set high in the mountains of North Lebanon, Douma is a village where landscape and heritage are deeply intertwined. From the Chalhoub family, three generations in.",
    memory:
      "I am used to call her Najo with my grandmother Nazo, they were the Amar and Chamess together, the perfect duo. I remember one end of summer, I couldn't come to Lebanon in the traditional July–August so I came just one week in September and all I did was staying in Mehmarch in my mom's village with my grandmother Nazo and Najo, because it was heaven. Sun, their laughs, good food and dolce vita à la libanaise. Today, only my Amar is physically here, and that's why I am giving her the name of one of the best olive oils in Lebanon.",
    pullQuote: "They were the Amar and Chamess together, the perfect duo.",
    spec: [
      { label: "Village", value: "Douma, North Lebanon" },
      { label: "Family", value: "Chalhoub, 3rd generation" },
      { label: "Harvest", value: "November" },
      { label: "Acidity", value: "< 0.5%" },
    ],
    images: [
      {
        src: "/products/najibe-4.png",
        w: 1114,
        h: 1412,
        alt: "Two Najibe tins on black",
      },
      {
        src: "/products/najibe-2.png",
        w: 1537,
        h: 1023,
        alt: "A single 1L Najibe tin",
      },
    ],
    variants: [
      { label: "250 ml", priceCents: null, stock: 10, available: true },
      { label: "1 L", priceCents: null, stock: 0, available: false },
      { label: "3 L", priceCents: null, stock: 0, available: false },
    ],
  },
  {
    handle: "nazira",
    name: "Teta Nazira",
    kind: "olive-oil",
    status: "draft",
    description: "Coming soon",
    spec: [],
    images: [],
    variants: [{ label: null, priceCents: null, stock: 10, available: true }],
  },
  {
    handle: "mimi-olive-oil",
    name: "Mimi",
    kind: "olive-oil",
    status: "draft",
    description: "Coming soon",
    spec: [],
    images: [],
    variants: [
      { label: "250 ml", priceCents: null, stock: 10, available: true },
      { label: "1 L", priceCents: null, stock: 0, available: false },
      { label: "3 L", priceCents: null, stock: 0, available: false },
    ],
  },
];

/** Everything the site is allowed to render. */
export const liveProducts = products.filter((p) => p.status === "active");

/** The named ones — a person, a memory, a jar. These are the site's spine. */
export const namedProducts = liveProducts.filter((p) => p.memory);

/** The made things — no memory attached, but the best photography we have. */
export const objectProducts = liveProducts.filter((p) => !p.memory);

/** Cheapest set price across a product's variants, or null if none is priced. */
export function fromPriceCents(p: Product): number | null {
  const priced = p.variants
    .map((v) => v.priceCents)
    .filter((c): c is number => c !== null);
  return priced.length ? Math.min(...priced) : null;
}

/** True only when we can honestly take money for this today. */
export function isBuyable(p: Product): boolean {
  return p.variants.some(
    (v) => v.priceCents !== null && v.available && v.stock > 0,
  );
}

/** Why a product cannot be bought — drives honest, specific button copy. */
export type UnbuyableReason = "no-price" | "out-of-stock";

export function unbuyableReason(p: Product): UnbuyableReason | null {
  if (isBuyable(p)) return null;
  return fromPriceCents(p) === null ? "no-price" : "out-of-stock";
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const KIND_LABEL: Record<ProductKind, string> = {
  "olive-oil": "Olive oil",
  "carob-molasses": "Carob molasses",
  "grape-molasses": "Grape molasses",
  carafe: "Carafe",
  coaster: "Coaster",
};

export const SHIPS_TO = [
  "Lebanon",
  "United States",
  "Canada",
  "United Kingdom",
  "France",
  "Germany",
  "Belgium",
  "Netherlands",
  "Spain",
  "Portugal",
  "Italy",
  "Switzerland",
  "Austria",
  "Denmark",
  "Sweden",
  "Norway",
  "Finland",
  "Ireland",
  "Poland",
  "Czechia",
  "Israel",
  "United Arab Emirates",
  "Australia",
  "New Zealand",
  "Japan",
  "South Korea",
  "Hong Kong",
  "Singapore",
  "Malaysia",
];
