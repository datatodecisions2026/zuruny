import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Zuruny's own photography is vendored into /public, but pointing
    // SHOPIFY_STORE_DOMAIN at another store falls back to that store's images,
    // which Shopify serves from its CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
