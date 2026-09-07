/**
 * Site content for Zuruny.
 *
 * The `memory` field on each person is the founder's own writing, transcribed
 * from the memory cards that shipped as product images on the original store.
 * The `origin` field is the grove the oil is actually pressed from, taken from
 * the product descriptions. They are different places and are kept separate on
 * purpose: one names the person, the other names the oil.
 */

export type Person = {
  name: string;
  product: string;
  kind: "Olive oil" | "Carob molasses" | "Grape molasses";
  village: string;
  memory: string;
  /** One line from the memory, for the homepage. */
  pull: string;
  origin?: string;
  spec: { label: string; value: string }[];
  image?: string;
  handle: string;
  href: string;
};

export const people: Person[] = [
  {
    name: "Najibe",
    pull:
      "They were the Amar and Chamess together, the perfect duo.",
    product: "Najibe",
    kind: "Olive oil",
    village: "Zghorta",
    memory:
      "I am used to call her Najo with my grandmother Nazo, they were the Amar and Chamess together, the perfect duo. I remember one end of summer, I couldn't come to Lebanon in the traditional July–August so I came just one week in September and all I did was staying in Mehmarch in my mom's village with my grandmother Nazo and Najo, because it was heaven. Sun, their laughs, good food and dolce vita à la libanaise. Today, only my Amar is physically here, and that's why I am giving her the name of one of the best olive oils in Lebanon.",
    origin:
      "Pressed in Douma, high in the mountains of North Lebanon, by the Chalhoub family — three generations in the same terraces. Harvested in November.",
    spec: [
      { label: "Village", value: "Douma, North Lebanon" },
      { label: "Family", value: "Chalhoub, 3rd generation" },
      { label: "Harvest", value: "November" },
      { label: "Acidity", value: "< 0.5%" },
    ],
    image: "/products/najibe-4.png",
    handle: "najibe",
    href: "/products/najibe",
  },
  {
    name: "Malvina",
    pull:
      "She had the kind of energy you simply don’t forget.",
    product: "Malvina",
    kind: "Olive oil",
    village: "Deir Mimas",
    memory:
      "I chose to honor my grandfather's mother because although I never had the chance to know him, I wanted to pay tribute to him. And what better way than celebrating the woman who gave him life? Whenever I ask about her, her presence still resonates through the memories of my father and my teta. She had the kind of energy you simply don't forget, someone who is still very much alive in the memories of those who loved her, and whose legacy somehow lives on in me.",
    origin:
      "From Deir Mimas in South Lebanon, where some of the trees have stood for centuries, grown by the Hasbani family. Harvested end of September into October.",
    spec: [
      { label: "Village", value: "Deir Mimas, South Lebanon" },
      { label: "Family", value: "Hasbani" },
      { label: "Harvest", value: "Late September – October" },
      { label: "Acidity", value: "< 0.5%" },
    ],
    image: "/products/malvina-2.png",
    handle: "malvina",
    href: "/products/malvina",
  },
  {
    name: "Em Ramiz",
    pull:
      "My teta always knows who is calling without even looking at her screen.",
    product: "Em'Ramiz",
    kind: "Olive oil",
    village: "Machghara",
    memory:
      "I decided to honor my grandmother's lineage because she looks so much like her mother. Since we were children, we have always visited them, or they have visited us. Their mother's name was Alice. Amale is my teta. Ramiz would always come to play cards with us and bring us chocolate. Sophie is the one who is always there to help everyone — you have a new baby? She is already on a plane. Afaf, the youngest, is always laughing, and oh God, I love her macaroni dish. Since the creation of Skype they have spoken every single day, at the same hour, one calling the other. My teta always knows who is calling without even looking at her screen.",
    origin:
      "Grown in Aabra, above the Phoenician city of Sidon, by the Mushantaf family. Early-harvested and made to be finished raw.",
    spec: [
      { label: "Village", value: "Aabra, South Lebanon" },
      { label: "Family", value: "Mushantaf, 2nd generation" },
      { label: "Harvest", value: "Early" },
      { label: "Acidity", value: "< 0.5%" },
    ],
    image: "/products/em-ramiz-1.png",
    handle: "em-ramiz",
    href: "/products/em-ramiz",
  },
  {
    name: "Georges",
    pull:
      "He is mine without ever truly being mine.",
    product: "Georges",
    kind: "Carob molasses",
    village: "Beirut",
    memory:
      "I never had the chance to know him, yet he has always been a part of my life. When I was younger, every summer we would visit his grave and pray. It's strange to pray and speak to someone you never knew — you have never heard the sound of his voice, his laugh, or even known his smell. Yet somehow we know him through the endless stories my grandmother tells, through the pictures I would find during family visits. \"Here's your jeddo.\" He is mine without ever truly being mine. Whenever I am asked, \"If you could interview one person, dead or alive, who would it be?\", my answer is always the same: him.",
    origin:
      "Carob pods, slow-reduced the traditional way. No added sugar, no preservatives. Good on labneh, on toast, and unexpectedly good with chicken.",
    spec: [
      { label: "Made from", value: "Carob pods" },
      { label: "Added sugar", value: "None" },
      { label: "Preservatives", value: "None" },
    ],
    handle: "georges-br-carob-molasses",
    href: "/products/georges-br-carob-molasses",
  },
  {
    name: "Fayez",
    pull:
      "He called me “the chamess.” Since that day, the sunflower has been my favourite flower.",
    product: "Fayez",
    kind: "Grape molasses",
    village: "Lebanon",
    memory:
      "I had the chance to know him, but not enough, and that has always been my greatest regret. In the videos we were always together, always happy, and he was always so proud of me. He never failed to make me smile, especially when he would put 2 kg of walnuts picked directly from the tree into my suitcase because he knew how much I loved them. I will never forget the day I found a huge sunflower and brought it to him. He looked at me, told me the name of the flower and called me \"the chamess.\" Since that day, the sunflower has been my favourite flower.",
    origin:
      "Grapes, reduced by traditional method until deep and fruity. A staple of the Mediterranean table for generations.",
    spec: [
      { label: "Made from", value: "Grapes" },
      { label: "Method", value: "Traditional reduction" },
      { label: "Added sugar", value: "None" },
    ],
    handle: "fayez-for-caroub-molasse",
    href: "/products/fayez-for-caroub-molasse",
  },
];

export const range = [
  { image: "/products/najibe-4.png", text: "Najibe · Douma" },
  { image: "/products/malvina-2.png", text: "Malvina · Deir Mimas" },
  { image: "/products/em-ramiz-1.png", text: "Em Ramiz · Aabra" },
  { image: "/products/bri2-zeit-2.png", text: "Bri' Zeit · carafe" },
  { image: "/products/tantour-1.png", text: "Tantour · carafe" },
  { image: "/products/costers-1.png", text: "Coaster · cedar" },
];

export const objects = [
  {
    image: "/products/bri2-zeit-1.png",
    label: "Bri' Zeit — carafe",
    link: "/products/bri2-zeit",
    alt: "The Bri' Zeit carafe, glazed oxblood with an olive-wood stopper",
  },
  {
    image: "/products/tantour-2.png",
    label: "Tantour — carafe",
    link: "/products/tantour",
    alt: "The Tantour carafe, a tall cone on an olive-wood base",
  },
  {
    image: "/products/costers-1.png",
    label: "Coaster — Lebanese cedar",
    link: "/products/costers",
    alt: "A quatrefoil coaster carved from Lebanese cedar",
  },
];

export const objectNotes = [
  {
    title: "Bri' Zeit",
    body: "The old Lebanese saying — el bri' zeit — reminds us that history repeats itself. A shape passed down through generations, now a vessel for your everyday pouring.",
  },
  {
    title: "Tantour",
    body: "Named for the tall silver headdress worn by Lebanese princesses. Bold, independent, and loyal in every curve.",
  },
  {
    title: "Coaster",
    body: "Cut from Lebanese cedar, which keeps its scent for years. The whole country, on your table, under a glass.",
  },
];

export const hero = [
  { image: "/products/malvina-2.png", caption: "Malvina, Deir Mimas" },
  { image: "/products/bri2-zeit-2.png", caption: "Bri' Zeit" },
  { image: "/products/em-ramiz-1.png", caption: "Em Ramiz, Aabra" },
  { image: "/products/tantour-1.png", caption: "Tantour" },
];

export const shipsTo = [
  "Lebanon", "United States", "Canada", "United Kingdom", "France", "Germany",
  "Belgium", "Netherlands", "Spain", "Portugal", "Italy", "Switzerland",
  "Austria", "Denmark", "Sweden", "Norway", "Finland", "Ireland", "Poland",
  "Czechia", "Israel", "United Arab Emirates", "Australia", "New Zealand",
  "Japan", "South Korea", "Hong Kong", "Singapore", "Malaysia",
];
