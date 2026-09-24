"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import { Box3, Mesh, Vector3 } from "three";
import { origins } from "@/data/lebanon-origins";
import type { Locale } from "@/lib/i18n";
import { findTerrain, placeOrigin, terrainConfig } from "./terrain";
import { SceneCamera } from "./SceneCamera";
import { useMediaQuery } from "./useMapEnvironment";
import { originCopy } from "./copy";
import styles from "./origins.module.css";

type Props = { selected: string | null; onSelect: (id: string) => void; active: boolean; reset: number; locale: Locale; onReady: () => void; zoom: number; onZoom: (zoom: number) => void };

function CanvasFallback({ onReady, message }: { onReady: () => void; message: string }) {
  useEffect(onReady, [onReady]);
  return <p role="status" className={styles.fallback}>{message}</p>;
}

function Relief({ selected, onSelect, active, reset, onReady, mobile, reduced, debugRef, zoom }: Props & {
  mobile: boolean; reduced: boolean; debugRef: RefObject<HTMLPreElement | null>; zoom: number;
}) {
  const variant = mobile ? "mobile" : "desktop";
  const { scene: source } = useGLTF(terrainConfig.models[variant], false);
  const { scene, markers, bounds } = useMemo(() => {
    const scene = source.clone(true);
    const originalBounds = new Box3().setFromObject(scene);
    const center = originalBounds.getCenter(new Vector3());
    const scale = 10 / originalBounds.getSize(new Vector3()).length();
    scene.position.copy(center).multiplyScalar(-scale);
    scene.scale.setScalar(scale);
    scene.traverse((object) => {
      if (object instanceof Mesh) { object.castShadow = !mobile; object.receiveShadow = !mobile; }
    });
    scene.updateMatrixWorld(true);
    const terrain = findTerrain(scene);
    const markers = origins.map((origin) => ({ origin, ...placeOrigin(terrain, origin) }));
    return { scene, markers, bounds: terrain.geometry.boundingBox! };
  }, [source, mobile]);
  useEffect(() => { onReady(); }, [onReady]);
  const selectedPoint = markers.find((marker) => marker.origin.id === selected)?.world;
  const debugInfo = `model: ${variant}\nselected: ${selected ?? "none"}\norientation: ${JSON.stringify(terrainConfig.orientation)}\nlocal axes: X east, -Z north, Y elevation\nbounds: ${bounds.min.toArray().map((n) => n.toFixed(3))} → ${bounds.max.toArray().map((n) => n.toFixed(3))}\n${markers.map((marker) => `${marker.origin.id}: ${marker.local.toArray().map((n) => n.toFixed(3))}`).join("\n")}`;

  return <>
    <primitive object={scene} dispose={null} />
    {markers.map(({ origin, world }) => <Html key={origin.id} position={world} center zIndexRange={[20, 1]} style={{ pointerEvents: "none" }}>
      <button type="button" tabIndex={-1} aria-hidden="true" aria-label={`${origin.product}, ${origin.name}`} aria-pressed={selected === origin.id}
        data-selected={selected === origin.id} data-muted={selected !== null && selected !== origin.id}
        className={styles.marker} onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); onSelect(origin.id); }}>
        <span className={styles.markerPoint} /><span className={styles.markerName}>{origin.product}</span>
      </button>
    </Html>)}
    <SceneCamera point={selectedPoint} reset={reset} mobile={mobile} reduced={reduced} active={active} debugRef={debugRef} debugInfo={debugInfo} zoom={zoom} />
  </>;
}

export default function TerrainScene(props: Props) {
  const mobile = useMediaQuery(terrainConfig.mobileQuery);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const debugRef = useRef<HTMLPreElement>(null);
  const [lost, setLost] = useState(false);
  const [debug] = useState(() => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("debug") === "true");
  const copy = originCopy[props.locale];
  if (lost) return <p role="status" className={styles.fallback}>{copy.unavailable}</p>;
  return <>
    <Canvas frameloop={props.active ? "demand" : "never"} dpr={mobile ? [1, 1.25] : [1, 1.75]} shadows={!mobile}
      camera={{ position: [0, 14, 9], fov: 36, near: 0.1, far: 100 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: mobile ? "low-power" : "default" }}
      fallback={<CanvasFallback onReady={props.onReady} message={copy.unavailable} />}
      onCreated={({ gl }) => {
        gl.domElement.setAttribute("aria-label", copy.map);
        gl.domElement.addEventListener("webglcontextlost", () => setLost(true), { once: true });
      }}>
      <ambientLight intensity={0.65} color="#edddc4" />
      <directionalLight position={[-5, 10, 4]} intensity={2.5} color="#ffe4bd" castShadow={!mobile}
        shadow-mapSize={[512, 512]} shadow-camera-left={-6} shadow-camera-right={6}
        shadow-camera-top={6} shadow-camera-bottom={-6} shadow-normalBias={0.04} shadow-bias={-0.001} />
      {!mobile && <directionalLight position={[4, 5, -4]} intensity={0.5} color="#b3bfc8" />}
      <Suspense fallback={null}><Relief {...props} mobile={mobile} reduced={reduced} debugRef={debugRef} /></Suspense>
    </Canvas>
    <div className={styles.zoom} role="group" aria-label={copy.map}>
      <button type="button" aria-label={copy.zoomIn} disabled={props.zoom >= 2} onClick={() => props.onZoom(Math.min(2, props.zoom + 1))}>+</button>
      <button type="button" aria-label={copy.zoomOut} disabled={props.zoom <= -1} onClick={() => props.onZoom(Math.max(-1, props.zoom - 1))}>−</button>
    </div>
    <span className={styles.north} aria-label={copy.north}>↑<br />N</span>
    {debug && <pre ref={debugRef} className={styles.debug}>Preparing terrain diagnostics…</pre>}
  </>;
}
