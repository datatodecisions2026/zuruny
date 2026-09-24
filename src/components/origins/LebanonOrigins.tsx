"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useCallback, useState } from "react";
import { origins } from "@/data/lebanon-origins";
import type { Product } from "@/lib/catalog";
import { usePreferences } from "@/lib/preferences";
import { OriginPanel } from "./OriginPanel";
import { originCopy } from "./copy";
import { useMapVisibility } from "./useMapEnvironment";
import styles from "./origins.module.css";

const TerrainScene = dynamic(() => import("./TerrainScene"), { ssr: false });

class MapBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("[zuruny:origins] Relief unavailable", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function LebanonOrigins({ products, onView }: { products: Product[]; onView: (handle: string) => void }) {
  const { locale } = usePreferences();
  const copy = originCopy[locale];
  const [selected, setSelected] = useState<string | null>(null);
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const { ref: mapRef, near, active } = useMapVisibility();
  const origin = origins.find((entry) => entry.id === selected);
  const product = products.find((entry) => entry.handle === origin?.productHandle && entry.status === "active");

  return <section className={styles.section} aria-labelledby="origins-title">
    <header className={styles.header}>
      <div><p className={styles.label}>{copy.eyebrow} <span aria-hidden="true"> / 01—05</span></p><h2 id="origins-title">{copy.title}</h2></div>
      <p className={styles.intro}>{copy.intro}</p>
    </header>
    <div className={styles.exhibit}>
      <div ref={mapRef} className={styles.map} data-active={active}>
        <MapBoundary fallback={<p role="status" className={styles.fallback}>{copy.unavailable}</p>}>
          {!ready && <p role="status" className={styles.fallback}>{copy.loading}</p>}
          {near && <TerrainScene selected={selected} onSelect={setSelected} active={active} reset={reset} locale={locale} onReady={onReady} zoom={zoom} onZoom={setZoom} />}
        </MapBoundary>
        <div className={styles.mapFooter}><span>{copy.gesture}</span><button type="button" onClick={() => { setSelected(null); setZoom(0); setReset((value) => value + 1); }}>{copy.reset} <span aria-hidden="true">↺</span></button></div>
      </div>
      <OriginPanel origin={origin} product={product} locale={locale} onView={onView} />
    </div>
    <nav aria-label={copy.list} className={styles.origins}>
      <ol>{origins.map((entry, index) => <li key={entry.id}>
        <button type="button" aria-pressed={selected === entry.id} onClick={() => setSelected(entry.id)}>
          <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><span><strong>{entry.product}</strong><small>{entry.name}</small></span><span className={styles.listDot} aria-hidden="true" />
        </button>
      </li>)}</ol>
    </nav>
  </section>;
}
