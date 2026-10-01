"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Cloud, Clouds, ContactShadows, Environment, Lightformer, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import {
  Box3,
  Color,
  Euler,
  Fog,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  Vector3,
  type Material,
} from "three";
import {
  CAMERA_KEYS,
  COMPANION_KEYS,
  DROP,
  HERO_KEYS,
  LANDED,
  poseAt,
  smoothstep,
  warmth,
  type Key,
} from "@/data/oilSceneTimeline";

// The table still life from the "Zuruny Final" Blender scene (plate, olives,
// herbs, clay jar), and the two labelled jars. Blender Z-up → three Y-up.
const TABLE = "/models/oil-scene.glb";
const HERO = "/models/jar.glb"; // Fayez, grape molasses
const COMPANION = "/models/jar_2.glb"; // Georges, carob molasses
const DRACO = "/draco/";
const CLOUD_TEXTURE = "/textures/cloud.png";

// Pieces of the old pour that no longer appear.
const RETIRED = ["ZU_Cup", "ZU_Decanter", "ZU_Splash", "ZU_Drop", "ZU_CupOil"];
// Clay jar: a small upright accent at the back of the still life.
const CLAY = { x: -0.2, z: -0.3 };
// Portrait still life: laid out in depth rather than across, seen from a
// little above, so the jars, plate and clay jar all fit a narrow screen with
// room for the CTA below. Tuned by eye at 390×844 and 360×640.
const PORTRAIT = {
  plate: { x: -0.09, z: 0.1 },
  clay: { x: -0.07, z: -0.28 },
  camera: new Vector3(-0.02, 0.28, 0.7),
  look: new Vector3(-0.02, -0.025, -0.02),
};
const JAR_MID = 0.045; // half a jar's height, where focus sits
// Closest the two jars' centres may come side to side: an 8.6 cm jar's width
// plus room for their tilts. Only applies while they're at about the same
// height (a jar's height apart or less).
const JAR_CLEARANCE = 0.105;
const JAR_HEIGHT = 0.095;

// Vertical half-FOV factor, tan(fov / 2) for the 40° camera.
const HALF_FOV = Math.tan((20 * Math.PI) / 180);
// Narrower than this and the camera backs off so the jars keep their width.
const MIN_ASPECT = 0.6;

const SKY = new Color("#f1ece3");
const STUDIO = new Color("#5c1a27");

// Olives and sprigs drifting up past the camera while the jars fall, like the
// ferns and leaves on the reference. `depth` is distance in front of the
// camera: near ones are big, quick and out of focus; far ones small and slow.
// `lane` is -1..1 across the view at that depth. They rise through the view
// between `from` and `to`.
const FLOATERS: { kind: "olive" | "sprig"; lane: number; depth: number; from: number; to: number }[] = [
  { kind: "sprig", lane: -0.85, depth: 0.13, from: 0.02, to: 0.2 },
  { kind: "olive", lane: 0.8, depth: 0.15, from: 0.18, to: 0.36 },
  { kind: "olive", lane: -0.7, depth: 0.12, from: 0.4, to: 0.56 },
  { kind: "sprig", lane: 0.9, depth: 0.16, from: 0.58, to: 0.76 },
  { kind: "olive", lane: 0.75, depth: 0.11, from: 0.8, to: 0.9 },
  { kind: "olive", lane: 0.55, depth: 0.32, from: 0, to: 0.3 },
  { kind: "olive", lane: -0.45, depth: 0.36, from: 0.12, to: 0.42 },
  { kind: "sprig", lane: 0.35, depth: 0.3, from: 0.3, to: 0.6 },
  { kind: "olive", lane: -0.9, depth: 0.34, from: 0.46, to: 0.74 },
  { kind: "olive", lane: 0.75, depth: 0.38, from: 0.6, to: 0.86 },
  { kind: "olive", lane: -0.3, depth: 0.8, from: 0, to: 0.5 },
  { kind: "sprig", lane: 0.6, depth: 0.9, from: 0.2, to: 0.7 },
  { kind: "olive", lane: -0.75, depth: 0.85, from: 0.4, to: 0.88 },
  { kind: "olive", lane: 0.2, depth: 0.95, from: 0.55, to: 0.95 },
];

// Cloud banks in the sky band (y ≈ 1), a few in front of the jars at the
// edges, and a low band the camera falls through on the way to the table.
// `s` scales drei's default cloud (≈ 8 units) down to scene meters.
const CLOUDS: { pos: [number, number, number]; s: number; seed: number; lite?: boolean }[] = [
  { pos: [-0.55, 1.15, -1.3], s: 0.09, seed: 1, lite: true },
  { pos: [0.6, 0.85, -1.2], s: 0.08, seed: 2, lite: true },
  { pos: [0.1, 1.35, -1.0], s: 0.07, seed: 3 },
  { pos: [-0.3, 0.75, -0.8], s: 0.06, seed: 4, lite: true },
  { pos: [0.35, 1.08, -0.45], s: 0.04, seed: 5 },
  { pos: [-0.38, 0.92, -0.5], s: 0.04, seed: 6, lite: true },
  { pos: [0.2, 0.9, 0.18], s: 0.025, seed: 7 },
  { pos: [-0.2, 1.1, 0.2], s: 0.025, seed: 8, lite: true },
  { pos: [-0.15, 0.55, -0.2], s: 0.04, seed: 9 },
  { pos: [0.18, 0.4, -0.1], s: 0.04, seed: 10, lite: true },
  { pos: [0, 0.62, 0.12], s: 0.03, seed: 11 },
];

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function glassMaterial(lite: boolean) {
  // Dark amber glass over near-black molasses. Alpha-blended, not
  // transmissive: two transmissive jars double the render cost and the
  // post-processing chain washed transmission out before.
  return lite
    ? new MeshStandardMaterial({ color: "#2a0c05", roughness: 0.05, transparent: true, opacity: 0.8, depthWrite: false })
    : new MeshPhysicalMaterial({
        color: "#3b1307",
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
        envMapIntensity: 1.4,
      });
}

/** Retire the pour, set up the still life and the floaters; returns what the scroll drives. */
function buildRig(table: Object3D, hero: Object3D, companion: Object3D, lite: boolean) {
  const get = (n: string) => {
    const o = table.getObjectByName(n);
    if (!o) throw new Error(`oil-scene.glb is missing ${n}`);
    return o;
  };
  for (const n of RETIRED) get(n).visible = false;

  table.traverse((o) => {
    if (!(o instanceof Mesh) || (o.material as Material).name !== "ZU_Terracotta") return;
    // The Blender clay tint is a color ramp glTF can't carry; keep the
    // normal/roughness maps and set the Zuruny terracotta here.
    const m = o.material as MeshStandardMaterial;
    m.map = null;
    m.color.set("#8e3b1c");
    m.metalness = 0;
    m.needsUpdate = true;
  });

  const glass = glassMaterial(lite);
  for (const jar of [hero, companion]) {
    jar.traverse((o) => {
      if (o instanceof Mesh && (o.material as Material).name === "ZU_JarGlass") o.material = glass;
    });
  }

  // Stand the clay jar upright on the table; remember where its footprint's
  // center sits relative to its pivot so it can be placed per frame.
  const clay = get("ZU_JarTilt");
  clay.rotation.set(0, 0, 0);
  clay.position.set(0, 0, 0);
  table.updateMatrixWorld(true);
  const clayBox = new Box3().setFromObject(get("ZU_Jar"));
  const clayCenter = clayBox.getCenter(new Vector3());
  const clayOffset = new Vector3(-clayCenter.x, -clayBox.min.y, -clayCenter.z);

  const plate = get("ZU_Plate");
  const plateBase = (plate.userData.baseX ??= plate.position.x) as number;
  const plateBaseZ = (plate.userData.baseZ ??= plate.position.z) as number;

  const pieces: Record<"olive" | "sprig", { mesh: Mesh; scale: Vector3; rest: Euler }> = {
    olive: { mesh: get("ZU_olive") as Mesh, scale: new Vector3(), rest: new Euler(0, 0, 0) },
    sprig: { mesh: get("ZU_rosmarin") as Mesh, scale: new Vector3(), rest: new Euler(0, 0, Math.PI / 2) },
  };
  for (const p of Object.values(pieces)) p.mesh.getWorldScale(p.scale);

  const floaters = FLOATERS.map((f, i) => {
    const src = pieces[f.kind];
    const geometry = src.mesh.geometry.clone();
    geometry.center();
    const mesh = new Mesh(geometry, src.mesh.material);
    mesh.scale.copy(src.scale);
    mesh.layers.set(1);
    table.add(mesh);
    return { ...f, mesh, rest: src.rest, spinAxis: new Vector3(1, i % 3, (i % 2) - 0.5).normalize() };
  });

  return { hero, companion, clay, clayOffset, plate, plateBase, plateBaseZ, floaters };
}

type Rig = ReturnType<typeof buildRig>;

const apart = new Vector3();

/**
 * The keyframed paths don't know about each other, and narrow screens squeeze
 * them closer; if the jars would intersect, slide the companion straight out
 * from the hero (side to side) to the clearance. The hero keeps its framing.
 */
function keepApart(hero: Object3D, companion: Object3D) {
  if (Math.abs(companion.position.y - hero.position.y) > JAR_HEIGHT) return;
  apart.subVectors(companion.position, hero.position).setY(0);
  const gap = apart.length();
  if (gap >= JAR_CLEARANCE) return;
  // Exactly stacked: push along x, toward the side the companion favours.
  if (gap < 1e-6) apart.set(1, 0, 0);
  apart.setLength(JAR_CLEARANCE - gap);
  companion.position.add(apart);
}

function place(obj: Object3D, keys: readonly Key[], p: number, xScale: number) {
  const [x, y, z, rx, ry, rz] = poseAt(keys, p);
  obj.position.set(x * xScale, y, z);
  obj.rotation.set(rx, ry, rz);
}

function Scene({
  progressRef,
  lite,
  focusRef,
  onReady,
}: {
  progressRef: RefObject<number>;
  lite: boolean;
  focusRef: RefObject<Vector3>;
  onReady: () => void;
}) {
  const { scene: table } = useGLTF(TABLE, DRACO);
  const { scene: hero } = useGLTF(HERO, DRACO);
  const { scene: companion } = useGLTF(COMPANION, DRACO);
  const get = useThree((s) => s.get);
  const rigRef = useRef<Rig | null>(null);
  const cloudsRef = useRef<Group>(null);
  const floorRef = useRef<MeshBasicMaterial>(null);
  const tint = useRef(new Color());
  const look = useRef(new Vector3());

  useLayoutEffect(() => {
    const rig = buildRig(table, hero, companion, lite);
    rigRef.current = rig;
    const { scene, invalidate } = get();
    scene.background = tint.current;
    scene.fog = new Fog(SKY, 1.2, 3.5);
    invalidate();
    return () => {
      for (const f of rig.floaters) table.remove(f.mesh);
      rigRef.current = null;
    };
  }, [table, hero, companion, lite, get]);

  useEffect(onReady, [onReady]);

  useFrame(({ camera, size, scene }) => {
    const rig = rigRef.current;
    if (!rig) return;
    const p = progressRef.current ?? 0;
    const aspect = size.width / size.height;
    const distMul = Math.max(1, MIN_ASPECT / aspect);
    // Narrow screens pull the jars toward the middle; the still life gets a
    // little more room than the sky so the plate and clay jar stay in frame.
    const landing = smoothstep((p - DROP) / (LANDED - DROP));
    const skySpread = clamp(aspect / 1.5, 0.3, 1);
    const xScale = skySpread + (clamp(aspect / 1.5, 0.55, 1) - skySpread) * landing;

    // Sky → studio.
    const w = warmth(p);
    tint.current.copy(SKY).lerp(STUDIO, w);
    const fog = scene.fog as Fog;
    fog.color.copy(tint.current);
    fog.near = 1.2 + (0.6 - 1.2) * w;
    fog.far = 3.5 + (1.6 - 3.5) * w;
    floorRef.current?.color.copy(tint.current);
    const clouds = cloudsRef.current;
    if (clouds) {
      clouds.visible = w < 0.99;
      const mesh = clouds.children.find((c): c is InstancedMesh => c instanceof InstancedMesh);
      if (mesh) (mesh.material as Material).opacity = 1 - w;
    }

    place(rig.hero, HERO_KEYS, p, xScale);
    place(rig.companion, COMPANION_KEYS, p, xScale);
    keepApart(rig.hero, rig.companion);

    const portrait = aspect < 1;
    const plate = portrait ? PORTRAIT.plate : { x: rig.plateBase * xScale, z: rig.plateBaseZ };
    rig.plate.position.set(plate.x, 0, plate.z);
    const clay = portrait ? PORTRAIT.clay : { x: CLAY.x * xScale, z: CLAY.z };
    rig.clay.position.set(clay.x + rig.clayOffset.x, rig.clayOffset.y, clay.z + rig.clayOffset.z);

    // Camera: portrait screens lift the jars above center so the copy can sit
    // below them; less so for the still life, where only the CTA sits below.
    const [camX, camY, camDist, lookY] = poseAt(CAMERA_KEYS, p);
    const dist = camDist * distMul;
    const lift = portrait ? 0.25 * HALF_FOV * dist : 0;
    camera.position.set(camX, camY - lift, dist);
    look.current.set(0, lookY - lift, 0);
    // Portrait: rise and pull back onto the whole still life as the jars land.
    if (portrait) {
      camera.position.lerp(PORTRAIT.camera, landing);
      look.current.lerp(PORTRAIT.look, landing);
    }
    camera.lookAt(look.current);
    // Focus on whichever jar is nearer the camera (Georges leads its own
    // chapter); on the table, between the two so both read sharp.
    const near = rig.companion.position.z > rig.hero.position.z ? rig.companion : rig.hero;
    focusRef.current.copy(near.position).lerp(rig.companion.position, 0.5 * landing).setY(near.position.y + JAR_MID);

    for (const { mesh, ...f } of rig.floaters) {
      const t = (p - f.from) / (f.to - f.from);
      // Off the camera's layer when not drifting through (a method, so the
      // React compiler lint accepts it inside the frame loop).
      const active = t > 0 && t < 1;
      mesh.layers.set(active ? 0 : 1);
      if (!active) continue;
      const depth = f.depth * distMul;
      const halfH = HALF_FOV * depth;
      mesh.position.set(
        camera.position.x + f.lane * aspect * halfH,
        camera.position.y + (t * 2.6 - 1.3) * halfH,
        camera.position.z - depth,
      );
      mesh.rotation.copy(f.rest);
      mesh.rotateOnAxis(f.spinAxis, t * 6);
    }
  });

  return (
    <>
      <primitive object={table} />
      <primitive object={hero} />
      <primitive object={companion} />
      <Clouds ref={cloudsRef} texture={CLOUD_TEXTURE} material={MeshBasicMaterial} limit={lite ? 60 : 140}>
        {CLOUDS.filter((c) => !lite || c.lite).map((c) => (
          <Cloud
            key={c.seed}
            seed={c.seed}
            position={c.pos}
            scale={c.s}
            segments={lite ? 8 : 12}
            fade={0}
            speed={0}
            opacity={0.9}
            color="#f8f5ef"
          />
        ))}
      </Clouds>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.0005}>
        <circleGeometry args={[3, 48]} />
        <meshBasicMaterial ref={floorRef} color={STUDIO} toneMapped={false} />
      </mesh>
      {!lite && <ContactShadows position-y={0.0005} scale={0.9} far={0.25} blur={2.2} opacity={0.55} resolution={256} />}
    </>
  );
}

/**
 * Finishing pass: glints bloom off the glass and lids, a light vignette and
 * fine grain give it a filmed look. Wide screens add a depth of field locked
 * on the hero jar, so near olives and clouds drift past soft. Weak GPUs skip
 * all of it.
 */
function Effects({
  wide,
  focusRef,
  progressRef,
}: {
  wide: boolean;
  focusRef: RefObject<Vector3>;
  progressRef: RefObject<number>;
}) {
  const dof = useRef<DepthOfFieldEffect>(null);
  useFrame(() => {
    const effect = dof.current;
    if (!effect) return;
    effect.target?.copy(focusRef.current);
    // The sky wants soft depth; the still life should read crisp like a
    // product shot, and near blur bled onto the jars at the table.
    const landing = smoothstep(((progressRef.current ?? 0) - DROP) / (LANDED - DROP));
    effect.bokehScale = 3.2 * (1 - 0.8 * landing);
  });
  return (
    <EffectComposer multisampling={wide ? 4 : 2}>
      {/* Above the cream sky's luminance, so only real highlights bloom. */}
      <Bloom mipmapBlur luminanceThreshold={0.98} luminanceSmoothing={0.2} intensity={0.45} />
      {wide ? <DepthOfField ref={dof} target={[0, 0, 0]} focusRange={0.3} bokehScale={3.2} /> : null}
      {/* Neutral keeps the cream sky and the label colors true; AgX greyed them. */}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.3} darkness={0.35} />
      <Noise premultiply opacity={0.15} />
    </EffectComposer>
  );
}

function LoadProgress({ onProgress }: { onProgress: (share: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => onProgress(progress / 100), [progress, onProgress]);
  return null;
}

export default function OilScene({
  progressRef,
  invalidateRef,
  onReady,
  onProgress,
}: {
  progressRef: RefObject<number>;
  invalidateRef: RefObject<(() => void) | null>;
  onReady: () => void;
  onProgress: (share: number) => void;
}) {
  const lite = useMemo(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    return (nav.deviceMemory ?? 4) <= 3 || (nav.hardwareConcurrency ?? 8) <= 4;
  }, []);
  const wide = useMemo(() => window.matchMedia("(min-width: 768px)").matches, []);
  const focusRef = useRef(new Vector3());

  return (
    <>
      <LoadProgress onProgress={onProgress} />
      <Canvas
        frameloop="demand"
        dpr={lite ? 1 : wide ? [1, 2] : [1, 1.6]}
        camera={{ fov: 40, near: 0.01, far: 10, position: [0, 1, 0.42] }}
        // Lite skips antialiasing for speed; everyone else gets the composer's MSAA.
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => {
          gl.toneMapping = NeutralToneMapping;
          invalidateRef.current = invalidate;
        }}
        fallback={null}
      >
        <directionalLight position={[-0.9, 0.9, 0.7]} intensity={2.4} color="#fff1dc" />
        <directionalLight position={[0.3, 0.4, -0.6]} intensity={1.6} color="#ffd9a0" />
        <ambientLight intensity={0.45} />
        {/* Soft studio panels for the glass and lids to reflect; rendered once, no network fetch. */}
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} position={[-2, 2, 2]} scale={[3, 2, 1]} />
          <Lightformer form="rect" intensity={2} color="#ffd8a8" position={[2, 1, -2]} scale={[2, 3, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Scene progressRef={progressRef} lite={lite} focusRef={focusRef} onReady={onReady} />
        </Suspense>
        {!lite && <Effects wide={wide} focusRef={focusRef} progressRef={progressRef} />}
      </Canvas>
    </>
  );
}

useGLTF.preload(TABLE, DRACO);
useGLTF.preload(HERO, DRACO);
useGLTF.preload(COMPANION, DRACO);
