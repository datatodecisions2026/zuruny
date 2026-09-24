export type LebanonOrigin = {
  id: string;
  name: string;
  region: string;

  lat: number;
  lng: number;

  mapX: number;
  mapY: number;

  product: string;
  productHandle: string;
  href: string;

  image?: string;
  note?: string;
};

export const origins: LebanonOrigin[] = [
  {
    id: "ain-el-rihaneh",
    name: "Ain el-Rihaneh",
    region: "Keserwan-Jbeil, Mount Lebanon",

    lat: 33.95966,
    lng: 35.64732,

    mapX: 0.352296,
    mapY: 0.546742,

    product: "Georges",
    productHandle: "georges-br-carob-molasses",
    href: "#georges",

    image: "/names/georges/GEORGES.webp",

    note:
      "The origin associated with Georges, in Ain el-Rihaneh, Mount Lebanon."
  },

  {
    id: "rashaya",
    name: "Rashaya",
    region: "Beqaa Governorate",

    lat: 33.50142,
    lng: 35.84488,

    mapX: 0.485788,
    mapY: 0.285160,

    product: "Fayez",
    productHandle: "fayez-for-caroub-molasse",
    href: "#fayez",

    image: "/names/fayez/fayez.webp",

    note:
      "Rashaya al-Wadi, a historic mountain town in Lebanon's Beqaa Governorate."
  },

  {
    id: "deir-mimas",
    name: "Deir Mimas",
    region: "South Lebanon",

    lat: 33.30194,
    lng: 35.54528,

    mapX: 0.300461,
    mapY: 0.166440,

    product: "Malvina",
    productHandle: "malvina",
    href: "#malvina",

    image: "/names/malvina/6bbc5b43-fe66-4742-b166-40d74124dfbd.webp",

    note:
      "The South Lebanon origin associated with Malvina."
  },

  {
    id: "aabra",
    name: "Aabra",
    region: "South Governorate",

    lat: 33.56667,
    lng: 35.40583,

    mapX: 0.207679,
    mapY: 0.317398,

    product: "Em Ramiz",
    productHandle: "em-ramiz",
    href: "#em-ramiz",

    image: "/names/em-ramiz/em ramiz.webp",

    note:
      "Aabra lies immediately east of Sidon, on hills overlooking the Mediterranean coast."
  },

  {
    id: "douma",
    name: "Douma",
    region: "Batroun District, North Lebanon",

    lat: 34.20457,
    lng: 35.84073,

    mapX: 0.468533,
    mapY: 0.690399,

    product: "Najibe",
    productHandle: "najibe",
    href: "#najibe",

    image: "/names/najibe/najibe.webp",

    note:
      "The North Lebanon origin associated with Najibe."
  }
];
