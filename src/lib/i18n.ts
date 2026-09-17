/**
 * English and French.
 *
 * The audience is largely the Lebanese diaspora, a great many of whom read
 * French first — so French is a real second language here, not a courtesy.
 *
 * What is NOT translated: the founder's memories. They are her own words and
 * the kit is explicit that they must not be rewritten; a translation of them
 * would be my words in her mouth. French readers get the English with a short
 * note, until she supplies her own French.
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

const en = {
  nav: {
    shop: "Shop",
    theNames: "The names",
    shipping: "Shipping",
    basket: "Basket",
    home: "Zuruny — home",
    primary: "Primary",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    account: "Account",
    signIn: "Sign in",
    signOut: "Sign out",
    admin: "Admin",
    itemsInBasket: (n: number) => `${n} items in basket`,
  },
  region: {
    label: "Destination",
    lebanon: "Lebanon",
    international: "International",
    switchLabel: "Change delivery region",
    intlNote:
      "Prices shown for delivery outside Lebanon, including export and freight.",
    lbNote: "Prices shown for delivery inside Lebanon.",
  },
  language: {
    switchLabel: "Change language",
  },
  hero: {
    eyebrow: "Zuruny · Beirut, Lebanon",
    headline: "Named after the people we come from.",
    sub: "Single-origin olive oil and molasses, pressed in named villages in Lebanon. Each one carries the name of someone in our family — and their story, in our own words.",
    ctaShop: "Shop everything",
    ctaNames: "Meet the names",
  },
  ledger: {
    names: "Names",
    villages: "Villages",
    products: "Products",
    countries: "Countries",
    blurbBefore:
      "Zuruny is a small food and homeware brand in Beirut. The oil is pressed by named families in named villages. The names on the tins belong to somebody else entirely — ",
    blurbOwn: "our own",
  },
  names: {
    title: "The names",
    sub: "Four of them so far. The writing below is the founder's own, reproduced exactly as it was given to us.",
    from: (place: string) => `From ${place}`,
    whyThisName: "Why it carries this name",
    inHerWords:
      "In the founder's own English. A French version is to come from her, not from us.",
  },
  product: {
    priceToCome: "Price to come",
    notYetReleased: "Not yet released",
    outOfStock: "Out of stock",
    soldOut: "Sold out",
    buy: (name: string) => `Buy ${name}`,
    photographyInProgress: "Photography in progress",
    noPhotoLong:
      "No photograph yet · we would rather show nothing than something that is not this",
    views: (n: number) => `${n} views`,
    showImage: (i: number, total: number) => `Show image ${i} of ${total}`,
    size: "Size",
    oneSize: "One size",
    quantity: "Quantity",
    total: "Total",
    addToBasket: "Add to basket",
    onlyNLeft: (n: number) => `Only ${n} left`,
    outOfStockBody:
      "This batch has sold out. Write to us and we will tell you when the next one is pressed.",
    notYetBody:
      "This one is not in production yet. We will publish a price when it is.",
    tellMeWhenBack: "Tell me when it is back",
    theRestOfIt: "The rest of it",
    shipsFrom: (n: number) => `Ships from Beirut to ${n} countries`,
    increase: (name: string) => `Increase quantity of ${name}`,
    decrease: (name: string) => `Decrease quantity of ${name}`,
  },
  objects: {
    title: "Objects",
    sub: "Ceramics thrown for the table, and a coaster cut from Lebanese cedar in the shape of our mark.",
    seeAll: (n: number) => `See all ${n} →`,
  },
  reach: {
    title: (n: number) => `We ship to ${n} countries.`,
    sub: "Most orders leave Beirut for a kitchen a long way from it. Prices are in US dollars.",
  },
  film: {
    label: "Zuruny brand film",
    caption: "Em Ramiz · Aabra, South Lebanon",
  },
  shop: {
    title: "The shop",
    sub: (total: number, inStock: number) =>
      `${total} things, ${inStock} of them ready to ship today. The rest are between harvests, and they are marked as such rather than quietly hidden.`,
    meta: (countries: number) => `Prices in USD · ships to ${countries} countries`,
    filterLabel: "Filter products",
    everything: "Everything",
    oliveOil: "Olive oil",
    molasses: "Molasses",
    carafes: "Carafes",
    cedar: "Cedar",
    showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
  },
  cart: {
    title: "Your basket",
    loading: "Loading…",
    empty: "Nothing in it yet.",
    emptyDrawer: "Your basket is empty.",
    browseShop: "Browse the shop",
    close: "Close",
    closeBasket: "Close basket",
    summary: "Summary",
    item: "item",
    items: "items",
    subtotal: "Subtotal",
    shippingByEmail: "Shipping quoted by email",
    shippingCalculated: "Shipping calculated by email",
    reviewOrder: "Review order",
    paymentNotice:
      "Card payment is not live yet. Send this basket to us and we will reply with a shipping quote for your country and a way to pay.",
    sendOrder: "Send this order",
    emptyBasket: "Empty basket",
    remove: "Remove",
    each: (price: string) => `${price} each`,
    reducedTo: (n: number) => `Reduced to ${n} — stock changed`,
    shipTo: (n: number) => `We ship to ${n} countries`,
    orderSubject: "Order request",
    orderIntro: "I would like to order:",
    orderSubtotal: "Subtotal",
    orderAddress: "Shipping address:",
    orderRegion: (region: string) => `Delivery region: ${region}`,
  },
  footer: {
    tagline: "A piece of Lebanon, wherever you are.",
    location: "Beirut, Lebanon",
    payment: "Online payment coming soon · orders by email",
  },
  kinds: {
    "olive-oil": "Olive oil",
    "carob-molasses": "Carob molasses",
    "grape-molasses": "Grape molasses",
    carafe: "Carafe",
    coaster: "Coaster",
  },
  a11y: {
    skip: "Skip to content",
    breadcrumb: "Breadcrumb",
    enquire: (name: string) => `Enquire about ${name}`,
  },
};

/** Same shape, in French. TypeScript checks it key for key against `en`. */
const fr: typeof en = {
  nav: {
    shop: "Boutique",
    theNames: "Les prénoms",
    shipping: "Livraison",
    basket: "Panier",
    home: "Zuruny — accueil",
    primary: "Principale",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    account: "Compte",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    admin: "Administration",
    itemsInBasket: (n: number) => `${n} articles dans le panier`,
  },
  region: {
    label: "Destination",
    lebanon: "Liban",
    international: "International",
    switchLabel: "Changer la région de livraison",
    intlNote:
      "Prix affichés pour une livraison hors du Liban, export et fret compris.",
    lbNote: "Prix affichés pour une livraison au Liban.",
  },
  language: {
    switchLabel: "Changer de langue",
  },
  hero: {
    eyebrow: "Zuruny · Beyrouth, Liban",
    headline: "Nommées d'après ceux dont nous venons.",
    sub: "Huile d'olive et mélasses d'origine unique, pressées dans des villages nommés du Liban. Chacune porte le prénom d'un membre de notre famille — et son histoire, dans nos propres mots.",
    ctaShop: "Voir la boutique",
    ctaNames: "Découvrir les prénoms",
  },
  ledger: {
    names: "Prénoms",
    villages: "Villages",
    products: "Produits",
    countries: "Pays",
    blurbBefore:
      "Zuruny est une petite maison beyrouthine d'épicerie et d'art de la table. L'huile est pressée par des familles nommées, dans des villages nommés. Les prénoms sur les bidons appartiennent à de tout autres personnes — ",
    blurbOwn: "les nôtres",
  },
  names: {
    title: "Les prénoms",
    sub: "Quatre à ce jour. Le texte ci-dessous est celui de la fondatrice, reproduit exactement tel qu'il nous a été confié.",
    from: (place: string) => `De ${place}`,
    whyThisName: "Pourquoi ce prénom",
    inHerWords:
      "En anglais, dans les mots de la fondatrice. Une version française viendra d'elle, et non de nous.",
  },
  product: {
    priceToCome: "Prix à venir",
    notYetReleased: "Pas encore disponible",
    outOfStock: "Rupture de stock",
    soldOut: "Épuisé",
    buy: (name: string) => `Acheter ${name}`,
    photographyInProgress: "Photographie en cours",
    noPhotoLong:
      "Pas encore de photographie · nous préférons ne rien montrer plutôt que montrer autre chose",
    views: (n: number) => `${n} vues`,
    showImage: (i: number, total: number) => `Voir l'image ${i} sur ${total}`,
    size: "Format",
    oneSize: "Format unique",
    quantity: "Quantité",
    total: "Total",
    addToBasket: "Ajouter au panier",
    onlyNLeft: (n: number) => `Plus que ${n}`,
    outOfStockBody:
      "Ce lot est épuisé. Écrivez-nous et nous vous préviendrons dès la prochaine pressée.",
    notYetBody:
      "Celui-ci n'est pas encore produit. Nous publierons un prix lorsqu'il le sera.",
    tellMeWhenBack: "Prévenez-moi du retour",
    theRestOfIt: "Le reste",
    shipsFrom: (n: number) => `Expédié de Beyrouth vers ${n} pays`,
    increase: (name: string) => `Augmenter la quantité de ${name}`,
    decrease: (name: string) => `Diminuer la quantité de ${name}`,
  },
  objects: {
    title: "Objets",
    sub: "Des céramiques tournées pour la table, et un dessous-de-verre taillé dans le cèdre du Liban à la forme de notre emblème.",
    seeAll: (n: number) => `Voir les ${n} →`,
  },
  reach: {
    title: (n: number) => `Nous livrons dans ${n} pays.`,
    sub: "La plupart des commandes quittent Beyrouth pour une cuisine très loin de là. Les prix sont en dollars américains.",
  },
  film: {
    label: "Film de marque Zuruny",
    caption: "Em Ramiz · Aabra, Liban-Sud",
  },
  shop: {
    title: "La boutique",
    sub: (total: number, inStock: number) =>
      `${total} produits, dont ${inStock} prêts à partir aujourd'hui. Les autres sont entre deux récoltes, et c'est indiqué plutôt que discrètement masqué.`,
    meta: (countries: number) => `Prix en USD · livraison dans ${countries} pays`,
    filterLabel: "Filtrer les produits",
    everything: "Tout",
    oliveOil: "Huile d'olive",
    molasses: "Mélasses",
    carafes: "Carafes",
    cedar: "Cèdre",
    showing: (shown: number, total: number) => `${shown} sur ${total} affichés`,
  },
  cart: {
    title: "Votre panier",
    loading: "Chargement…",
    empty: "Il est encore vide.",
    emptyDrawer: "Votre panier est vide.",
    browseShop: "Voir la boutique",
    close: "Fermer",
    closeBasket: "Fermer le panier",
    summary: "Récapitulatif",
    item: "article",
    items: "articles",
    subtotal: "Sous-total",
    shippingByEmail: "Livraison chiffrée par e-mail",
    shippingCalculated: "Livraison calculée par e-mail",
    reviewOrder: "Vérifier la commande",
    paymentNotice:
      "Le paiement par carte n'est pas encore actif. Envoyez-nous ce panier et nous vous répondrons avec un tarif de livraison pour votre pays et un moyen de paiement.",
    sendOrder: "Envoyer cette commande",
    emptyBasket: "Vider le panier",
    remove: "Retirer",
    each: (price: string) => `${price} l'unité`,
    reducedTo: (n: number) => `Réduit à ${n} — le stock a changé`,
    shipTo: (n: number) => `Nous livrons dans ${n} pays`,
    orderSubject: "Demande de commande",
    orderIntro: "Je souhaite commander :",
    orderSubtotal: "Sous-total",
    orderAddress: "Adresse de livraison :",
    orderRegion: (region: string) => `Région de livraison : ${region}`,
  },
  footer: {
    tagline: "Un morceau du Liban, où que vous soyez.",
    location: "Beyrouth, Liban",
    payment: "Paiement en ligne bientôt · commandes par e-mail",
  },
  kinds: {
    "olive-oil": "Huile d'olive",
    "carob-molasses": "Mélasse de caroube",
    "grape-molasses": "Mélasse de raisin",
    carafe: "Carafe",
    coaster: "Dessous-de-verre",
  },
  a11y: {
    skip: "Aller au contenu",
    breadcrumb: "Fil d'Ariane",
    enquire: (name: string) => `Se renseigner sur ${name}`,
  },
};

const DICTS = { en, fr };

export type Dict = typeof en;

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Build a locale-aware href. English lives at the bare path. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
