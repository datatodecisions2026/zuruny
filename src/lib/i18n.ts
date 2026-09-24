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

import type { ProductKind } from "@/lib/catalog";

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
    artisans: "Our artisans",
    about: "About",
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
  artisans: {
    title: "Our artisans",
    sub: "Behind every bottle and object, there is a person: a farmer, a potter, a glassblower, a grower, a maker. People who shaped our land long before we were born, and who continue to hold it together today.",
    bioComingSoon: "Bio coming soon.",
  },
  kindTagline: {
    "olive-oil": "Where nature meets meaning",
    "carob-molasses": "Where heritage meets taste",
    "grape-molasses": "Where heritage meets taste",
    carafe: "Where craft meets heart",
  } as Partial<Record<ProductKind, string>>,
  about: {
    title: "About Zuruny",
    kicker: "Taste the land. Support the craft. Carry the story.",
    sections: [
      {
        title: "A land of sun, soil, and stories",
        body: "Lebanon's south and Mediterranean hillsides are places where time slows down, where olive trees grow like memories, where craft is a language, and where every home carries the scent of oil warming on the table. Zuruny was born from this world: from a love of the land, its flavors, its beauty, and the people who keep its traditions alive. This is for anyone who loves good olive oil, handcrafted objects, and the poetry of the Mediterranean, whether you live in Lebanon or far from it.",
      },
      {
        title: "Craft that holds a soul",
        body: "Behind every bottle and object, there is a person: a farmer, a potter, a glassblower, a grower, a maker. People who shaped our land long before we were born, and who continue to hold it together today. We work with these artisans to turn heritage into living design, objects that feel warm, human, and rooted.",
      },
      {
        title: "More than olive oil",
        body: "Our oils come from different Lebanese regions, each with its own character: bold, fruity, peppery, delicate. Each one shaped by altitude, sun, wind, and ancestral knowledge. We share the harvest year, the olive variety, the polyphenols, and the best culinary use for each oil. Because olive oil, like wine, has terroir — and Lebanon has many.",
      },
      {
        title: "For those who stayed and those who roam",
        body: "Zuruny connects people who love Lebanon: those who live there, those who left, and those who simply fell in love with its landscapes, flavors, and soul. Your choice supports local families, preserves endangered crafts, and helps keep villages alive with dignity.",
      },
      {
        title: "What we protect",
        body: "Without active support, Lebanon's ancestral crafts risk disappearing. Olive groves risk being abandoned. Entire regions risk losing the knowledge that shaped them. Zuruny exists to keep these traditions breathing, beautifully and sustainably.",
      },
      {
        title: "A future built on roots and creation",
        body: "We envision a world where Lebanese craftsmanship is celebrated globally. Where olive oil is appreciated for its terroir. Where artisans thrive. Where every table from Beirut to Paris, from London to São Paulo can hold a piece of Lebanon, offered with pride. Zuruny is heritage made tangible — a way to taste, touch, and carry the Mediterranean, wherever you are.",
      },
    ],
    closing: "Because you deserve to feel home at home.",
  },
  film: {
    label: "Zuruny brand film",
    caption: "Em Ramiz · Aabra, Chouf",
  },
  story: {
    title: "From our trees to your table",
    body: "Every bottle begins in the grove — named after people, pressed in named villages, carried from Beirut to kitchens around the world. This is the work before the product.",
  },
  cinematic: {
    idle: { eyebrow: "", title: "", body: "" },
    intro: {
      eyebrow: "Rooted in Lebanon",
      title: "Time shapes every tree",
      body: "A story grown over generations, from soil that holds centuries of Mediterranean sun.",
    },
    canopy: {
      eyebrow: "Into the canopy",
      title: "Where the journey becomes gold",
      body: "Deeper into the foliage, closer to the fruit. Every leaf is a small act of patience.",
    },
    oilDrop: {
      eyebrow: "The essence",
      title: "One drop, the whole story",
      body: "From the fruit to the glass — each droplet carries the land, the climate, and the craft.",
    },
    loading: {
      eyebrow: "Zuruny · Beirut",
      title: "Preparing our stories",
      sub: "The grove takes its time. So will we, for a moment.",
    },
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
  account: {
    title: "Your account",
    createAccount: "Create account",
    name: "Name",
    email: "Email",
    password: "Password",
    working: "One moment…",
    signedInAs: (email: string) => `Signed in as ${email}`,
    orders: "Your orders",
    noOrders: "No orders yet.",
    orderRef: "Reference",
    orderPlaced: "Placed",
    orderTotal: "Total",
    statusPendingPayment: "Awaiting payment",
    statusPaid: "Paid",
    statusFailed: "Payment failed",
    statusCancelled: "Cancelled",
    statusShipped: "Shipped",
    statusRefunded: "Refunded",
    whyAccount:
      "An account is how you see an order after you have placed it — what you ordered, what it came to, and where it has got to.",
    notConfigured:
      "Accounts are not switched on yet. Orders still reach us by email.",
  },
  order: {
    thanksTitle: "Thank you.",
    thanksBody:
      "Your payment has gone through. We will email you when it ships from Beirut.",
    pendingTitle: "Payment not completed",
    pendingBody:
      "We have kept your order. Nothing has been charged, and you can pay from your account page.",
    notFoundTitle: "Order not found",
    notFoundBody:
      "We could not find that order on your account. If you have just paid, sign in with the address you used.",
    checkout: "Pay now",
    checkingOut: "Opening payment…",
    signInToOrder: "Sign in to order",
    signInWhy:
      "Orders live on an account so you can see them afterwards, and so we can tell you when they ship.",
    failed: "We could not start that payment. Nothing has been charged.",
    unavailable:
      "Something in your basket has just sold out. Check it and try again.",
    notLive:
      "Card payment is not switched on yet. Send this basket by email and we will reply with a way to pay.",
  },
  admin: {
    title: "Admin",
    products: "Products",
    orders: "Orders",
    notAllowed: "This area is for the shop owner.",
    stock: "Stock",
    price: "Price",
    status: "Status",
    customer: "Customer",
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
    artisans: "Nos artisans",
    about: "À propos",
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
  artisans: {
    title: "Nos artisans",
    sub: "Derrière chaque bouteille et chaque objet, il y a une personne : un fermier, un potier, un verrier, un producteur, un artisan. Des personnes qui ont façonné notre terre bien avant nous, et qui continuent de la faire vivre aujourd'hui.",
    bioComingSoon: "Biographie à venir.",
  },
  kindTagline: {
    "olive-oil": "Où la nature rencontre le sens",
    "carob-molasses": "Où l'héritage rencontre le goût",
    "grape-molasses": "Où l'héritage rencontre le goût",
    carafe: "Où l'artisanat rencontre le cœur",
  } as Partial<Record<ProductKind, string>>,
  about: {
    title: "À propos de Zuruny",
    kicker: "Goûtez la terre. Soutenez l'artisanat. Portez l'histoire.",
    sections: [
      {
        title: "Une terre de soleil, de terre et d'histoires",
        body: "Le Sud du Liban et ses collines méditerranéennes sont des lieux où le temps ralentit, où les oliviers poussent comme des souvenirs, où l'artisanat est un langage, et où chaque maison porte le parfum de l'huile qui chauffe sur la table. Zuruny est née de ce monde : d'un amour pour la terre, ses saveurs, sa beauté, et les personnes qui en gardent les traditions vivantes. C'est pour quiconque aime la bonne huile d'olive, les objets artisanaux et la poésie de la Méditerranée, que l'on vive au Liban ou loin de lui.",
      },
      {
        title: "Un artisanat qui porte une âme",
        body: "Derrière chaque bouteille et chaque objet, il y a une personne : un fermier, un potier, un verrier, un producteur, un artisan. Des personnes qui ont façonné notre terre bien avant nous, et qui continuent de la faire vivre aujourd'hui. Nous travaillons avec ces artisans pour transformer l'héritage en design vivant, des objets qui se sentent chaleureux, humains et enracinés.",
      },
      {
        title: "Plus qu'une huile d'olive",
        body: "Nos huiles viennent de différentes régions du Liban, chacune avec son propre caractère : corsé, fruité, poivré, délicat. Chacune façonnée par l'altitude, le soleil, le vent et un savoir ancestral. Nous partageons l'année de récolte, la variété d'olive, les polyphénols, et le meilleur usage culinaire de chaque huile. Car l'huile d'olive, comme le vin, a un terroir — et le Liban en a beaucoup.",
      },
      {
        title: "Pour ceux qui sont restés et ceux qui ont voyagé",
        body: "Zuruny relie les personnes qui aiment le Liban : celles qui y vivent, celles qui l'ont quitté, et celles qui sont simplement tombées amoureuses de ses paysages, de ses saveurs et de son âme. Votre choix soutient des familles locales, préserve des savoir-faire en voie de disparition, et aide à maintenir des villages vivants, avec dignité.",
      },
      {
        title: "Ce que nous protégeons",
        body: "Sans un soutien actif, les savoir-faire ancestraux du Liban risquent de disparaître. Les oliveraies risquent d'être abandonnées. Des régions entières risquent de perdre le savoir qui les a façonnées. Zuruny existe pour que ces traditions continuent de vivre, avec beauté et durabilité.",
      },
      {
        title: "Un avenir bâti sur des racines et la création",
        body: "Nous envisageons un monde où l'artisanat libanais est célébré mondialement. Où l'huile d'olive est appréciée pour son terroir. Où les artisans prospèrent. Où chaque table, de Beyrouth à Paris, de Londres à São Paulo, peut porter un morceau du Liban, offert avec fierté. Zuruny est un héritage rendu tangible — une façon de goûter, toucher et porter la Méditerranée, où que vous soyez.",
      },
    ],
    closing: "Parce que vous méritez de vous sentir chez vous, chez vous.",
  },
  film: {
    label: "Film de marque Zuruny",
    caption: "Em Ramiz · Aabra, Mont-Liban",
  },
  story: {
    title: "De nos oliviers à votre table",
    body: "Chaque bouteille commence dans le verger — prénommée d'après des personnes, pressée dans des villages nommés, expédiée de Beyrouth vers des cuisines du monde entier. Voilà le travail avant le produit.",
  },
  cinematic: {
    idle: { eyebrow: "", title: "", body: "" },
    intro: {
      eyebrow: "Enraciné au Liban",
      title: "Le temps façonne chaque arbre",
      body: "Une histoire cultivée au fil des générations, dans une terre nourrie de siècles de soleil méditerranéen.",
    },
    canopy: {
      eyebrow: "Sous la canopée",
      title: "Là où le voyage devient or",
      body: "Plus profondément dans le feuillage, plus près du fruit. Chaque feuille est un petit acte de patience.",
    },
    oilDrop: {
      eyebrow: "L'essence",
      title: "Une goutte, toute l'histoire",
      body: "Du fruit au verre — chaque goutte porte la terre, le climat et le savoir-faire.",
    },
    loading: {
      eyebrow: "Zuruny · Beyrouth",
      title: "Nous préparons nos histoires",
      sub: "Le verger prend son temps. Nous aussi, un instant.",
    },
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
  account: {
    title: "Votre compte",
    createAccount: "Créer un compte",
    name: "Nom",
    email: "E-mail",
    password: "Mot de passe",
    working: "Un instant…",
    signedInAs: (email: string) => `Connecté en tant que ${email}`,
    orders: "Vos commandes",
    noOrders: "Aucune commande pour le moment.",
    orderRef: "Référence",
    orderPlaced: "Passée le",
    orderTotal: "Total",
    statusPendingPayment: "En attente de paiement",
    statusPaid: "Payée",
    statusFailed: "Paiement échoué",
    statusCancelled: "Annulée",
    statusShipped: "Expédiée",
    statusRefunded: "Remboursée",
    whyAccount:
      "Un compte vous permet de suivre une commande après l'avoir passée : ce que vous avez commandé, le montant, et où elle en est.",
    notConfigured:
      "Les comptes ne sont pas encore activés. Les commandes nous parviennent toujours par e-mail.",
  },
  order: {
    thanksTitle: "Merci.",
    thanksBody:
      "Votre paiement est passé. Nous vous écrirons au départ du colis de Beyrouth.",
    pendingTitle: "Paiement non finalisé",
    pendingBody:
      "Nous avons conservé votre commande. Rien n'a été débité, et vous pouvez payer depuis votre compte.",
    notFoundTitle: "Commande introuvable",
    notFoundBody:
      "Nous ne trouvons pas cette commande sur votre compte. Si vous venez de payer, connectez-vous avec l'adresse utilisée.",
    checkout: "Payer maintenant",
    checkingOut: "Ouverture du paiement…",
    signInToOrder: "Se connecter pour commander",
    signInWhy:
      "Les commandes sont liées à un compte pour que vous puissiez les suivre, et pour que nous puissions vous prévenir de l'expédition.",
    failed: "Nous n'avons pas pu lancer le paiement. Rien n'a été débité.",
    unavailable:
      "Un article de votre panier vient d'être épuisé. Vérifiez-le et réessayez.",
    notLive:
      "Le paiement par carte n'est pas encore activé. Envoyez ce panier par e-mail et nous vous répondrons avec un moyen de paiement.",
  },
  admin: {
    title: "Administration",
    products: "Produits",
    orders: "Commandes",
    notAllowed: "Cet espace est réservé au propriétaire de la boutique.",
    stock: "Stock",
    price: "Prix",
    status: "Statut",
    customer: "Client",
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

/** The canonical page destinations shared by desktop and mobile navigation. */
export function primaryNavigation(locale: Locale) {
  const t = getDict(locale);

  return [
    { href: localePath(locale, "/shop"), label: t.nav.shop },
    { href: localePath(locale, "/names"), label: t.nav.theNames },
    { href: localePath(locale, "/artisans"), label: t.nav.artisans },
    { href: localePath(locale, "/about"), label: t.nav.about },
    { href: localePath(locale, "/shipping"), label: t.nav.shipping },
  ];
}

/** Build a locale-aware href. English lives at the bare path. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
