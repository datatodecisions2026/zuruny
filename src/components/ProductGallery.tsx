"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/catalog";
import { usePreferences } from "@/lib/preferences";

export function ProductGallery({ product }: { product: Product }) {
  const { t } = usePreferences();
  const [active, setActive] = useState(0);
  const images = product.images;

  if (images.length === 0) {
    return (
      <div className="u-damask relative flex aspect-[4/5] flex-col justify-between overflow-hidden bg-oxblood p-8 lg:p-12">
        <span
          aria-hidden
          className="u-emblem size-12 text-ochre/70"
          style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
        />
        {product.pullQuote && (
          <p className="u-display text-[length:var(--step-2)] text-cream">
            &ldquo;{product.pullQuote}&rdquo;
          </p>
        )}
        <p className="u-mono text-cream/55">{t.product.noPhotoLong}</p>
      </div>
    );
  }

  const current = images[active];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-ground-2">
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 52vw, 100vw"
            className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out-soft)] ${
              i === active
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-105 opacity-0"
            }`}
          />
        ))}

        {images.length > 1 && (
          <span className="u-mono absolute bottom-4 right-4 bg-ground/70 px-3 py-1.5 text-cream">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-4 flex gap-3">
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t.product.showImage(i + 1, images.length)}
                aria-current={i === active}
                className={`relative block size-20 overflow-hidden border transition-[border-color,transform] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1 ${
                  i === active ? "border-ochre" : "border-[var(--rule)]"
                }`}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only" aria-live="polite">
        {current.alt}
      </p>
    </div>
  );
}
