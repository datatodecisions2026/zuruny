"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import {
  AgXToneMapping,
  Box3,
  Color,
  Euler,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  type Material,
} from "three";
import {
  LAND,
  cameraPullback,
  cameraSettle,
  dropState,
  itemFall,
  jarExit,
  jarTilt,
  splashGrow,
} from "@/data/oilSceneTimeline";

// Exported from the "Zuruny Final" Blender scene. Blender Z-up → three Y-up,
// so a Blender (x, y, z) is (x, z, -y) here.
const MODEL = "/models/oil-scene.glb";
const DRACO = "/draco/";

// Pour point, raised well above the Blender pose (0.3) so the drop has a
// long fall through open space before the still life comes into view.
const LIP_Y = 0.9;
const DROP_H = 0.028;
const DROP_STRETCH = 1.9; // how long the teardrop draws out before it lets go
const OIL_SURFACE = 0.044; // top of ZU_CupOil, the full Blender level

const FINAL_LOOK_Y = 0.1;
const FOLLOW_DIST = 0.45;
const FINAL_DIST = 1.05;
// Vertical half-FOV factor, tan(fov / 2) for the 40° camera.
const HALF_FOV = Math.tan((20 * Math.PI) / 180);
// On landscape screens the drop rides at this share of the half-width right
// of centre, leaving the left side for copy. Portrait stays centred.
const WIDE_SHIFT = 0.36;
// Seamless studio sweep, after the burgundy backdrop in oil_drop_new.mp4.
const BACKDROP = "#5c1a27";

// Falling olives and sprigs. Each rests at (x, z) on the table, clear of the
// cup (0,0), decanter (0.15,-0.2) and plate (-0.1,0.085), and falls in a lane
// (laneX, laneZ) that passes through the drop's camera view at crossAt. Lanes
// nearer the camera (larger laneZ) sweep past faster: the parallax. Lanes are
// kept inside the narrow portrait view at their depth.
const FALLERS: { kind: "olive" | "sprig"; x: number; z: number; crossAt: number; speed: number; laneX: number; laneZ: number }[] = [
  { kind: "olive", x: 0.07, z: 0.07, crossAt: 0.2, speed: 2.2, laneX: -0.03, laneZ: 0.12 },
  { kind: "olive", x: 0.1, z: 0.16, crossAt: 0.26, speed: 1.8, laneX: 0.09, laneZ: -0.3 },
  { kind: "sprig", x: 0.02, z: 0.28, crossAt: 0.31, speed: 2, laneX: -0.08, laneZ: -0.2 },
  { kind: "olive", x: 0.03, z: 0.2, crossAt: 0.36, speed: 2.6, laneX: 0.025, laneZ: 0.15 },
  { kind: "olive", x: -0.05, z: 0.24, crossAt: 0.42, speed: 1.7, laneX: -0.1, laneZ: -0.35 },
  { kind: "olive", x: 0.12, z: 0.26, crossAt: 0.47, speed: 2.1, laneX: 0.06, laneZ: -0.05 },
  { kind: "sprig", x: 0.1, z: 0.11, crossAt: 0.52, speed: 2.4, laneX: 0.03, laneZ: 0.1 },
  { kind: "olive", x: -0.11, z: 0.22, crossAt: 0.57, speed: 1.8, laneX: -0.06, laneZ: -0.1 },
  { kind: "olive", x: 0.06, z: 0.3, crossAt: 0.62, speed: 1.6, laneX: 0.08, laneZ: -0.25 },
  { kind: "olive", x: 0, z: 0.13, crossAt: 0.66, speed: 1.5, laneX: -0.025, laneZ: 0.12 },
  { kind: "olive", x: 0.14, z: 0.05, crossAt: 0.7, speed: 1.4, laneX: 0.05, laneZ: 0 },
  { kind: "olive", x: -0.08, z: 0.31, crossAt: 0.74, speed: 1.3, laneX: -0.05, laneZ: -0.1 },
];

/**
 * Drop and camera at a scroll position. The drop draws out into a long
 * teardrop at the lip, lets go, and falls alone; the camera rides with it,
 * holding it in the upper third so copy can sit below, then settles frontal
 * on the still life.
 */
function poseAt(p: number) {
  const lip = LIP_Y - 0.004;
  const d = dropState(p);
  const swell = 0.3 + 0.7 * d.grow;
  const stretch = 1 + (DROP_STRETCH - 1) * d.stretch;
  const dropH = DROP_H * swell * stretch;
  const hang = lip - dropH;
  const dropY = hang - (hang - OIL_SURFACE) * d.fall;

  const settle = cameraSettle(p);
  // Close while following so the drop keeps its size; wide only at the end.
  const dist = 0.3 + (FOLLOW_DIST - 0.3) * cameraPullback(p) + (FINAL_DIST - FOLLOW_DIST) * settle;
  // Offset scales with distance so the drop holds the same screen height.
  const followY = p < LAND ? dropY + dropH / 2 - dist * 0.2 : OIL_SURFACE;
  const lookY = followY + (FINAL_LOOK_Y - followY) * settle;
  return {
    drop: { visible: d.visible, y: dropY, thin: swell / Math.sqrt(stretch), tall: swell * stretch },
    lookY,
    camY: lookY + 0.05 * settle,
    dist,
  };
}

function makeMaterials(lite: boolean) {
  if (lite) {
    // ponytail: weak GPUs skip the transmission pass entirely; plain alpha
    // blending reads as oil/glass at phone size.
    return {
      oil: new MeshStandardMaterial({ color: "#bfa82a", roughness: 0.04, transparent: true, opacity: 0.85 }),
      drop: new MeshStandardMaterial({ color: "#c9b331", roughness: 0.03, transparent: true, opacity: 0.9 }),
      glass: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.02, transparent: true, opacity: 0.18, depthWrite: false }),
    };
  }
  return {
    // Transmissive: refracts whatever opaque scene is behind it.
    oil: new MeshPhysicalMaterial({
      // Olive gold: a green-gold tint, clear rather than milky.
      color: "#c9b22c",
      // Partial: fully clear oil takes on the burgundy sweep behind it.
      transmission: 0.8,
      ior: 1.47,
      thickness: 0.02,
      roughness: 0.02,
      attenuationColor: new Color("#a39418"),
      attenuationDistance: 0.06,
      clearcoat: 0.3,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.35, // flat oil surfaces otherwise mirror the studio panels
    }),
    // A falling drop is too thin to tint what it refracts on its own, so the
    // olive-gold attenuation is tuned short to color it through.
    drop: new MeshPhysicalMaterial({
      color: "#d2bd35",
      transmission: 0.7,
      ior: 1.47,
      thickness: 0.012,
      roughness: 0.02,
      attenuationColor: new Color("#9c9016"),
      attenuationDistance: 0.015,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    // Glass is alpha-blended, not transmissive: three never draws a
    // transmissive object inside another, so transmissive glass would hide
    // the oil in the cup and decanter.
    glass: new MeshPhysicalMaterial({
      color: "#ffffff",
      roughness: 0.02,
      ior: 1.5,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      envMapIntensity: 2.2,
      clearcoat: 1,
    }),
  };
}

/** Swap in the web materials and add the falling pieces; returns what the scroll drives. */
function buildRig(scene: Object3D, lite: boolean) {
  const mats = makeMaterials(lite);
  scene.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const name = (o.material as Material).name;
    if (name === "ZU_OliveOil") o.material = mats.oil;
    else if (name === "ZU_Glass") o.material = mats.glass;
    else if (name === "ZU_Terracotta") {
      // The Blender clay tint is a color ramp glTF can't carry; keep the
      // normal/roughness maps and set the Zuruny terracotta here.
      const m = o.material as MeshStandardMaterial;
      m.map = null;
      m.color.set("#8e3b1c");
      m.metalness = 0;
      m.needsUpdate = true;
    }
  });

  const get = (n: string) => {
    const o = scene.getObjectByName(n);
    if (!o) throw new Error(`oil-scene.glb is missing ${n}`);
    return o;
  };
  const tilt = get("ZU_JarTilt");
  const drop = get("ZU_Drop");
  drop.traverse((o) => {
    if (o instanceof Mesh) o.material = mats.drop;
  });
  const splash = get("ZU_Splash");
  splash.position.y = OIL_SURFACE;

  scene.updateMatrixWorld(true);
  const pieces: Record<"olive" | "sprig", { mesh: Mesh; scale: Vector3; rest: Euler }> = {
    olive: { mesh: get("ZU_olive") as Mesh, scale: new Vector3(), rest: new Euler(0, 0, 0) },
    sprig: { mesh: get("ZU_rosmarin") as Mesh, scale: new Vector3(), rest: new Euler(0, 0, Math.PI / 2) },
  };
  for (const p of Object.values(pieces)) p.mesh.getWorldScale(p.scale);

  const fallers = FALLERS.map((f, i) => {
    const src = pieces[f.kind];
    const geometry = src.mesh.geometry.clone();
    geometry.center();
    const mesh = new Mesh(geometry, src.mesh.material);
    mesh.scale.copy(src.scale);
    mesh.rotation.copy(src.rest);
    mesh.updateMatrixWorld(true);
    const restY = -new Box3().setFromObject(mesh).min.y;
    scene.add(mesh);
    // Height above rest at which it must pass through the middle of the
    // drop's camera view.
    const crossHeight = poseAt(f.crossAt).lookY - restY;
    return { ...f, mesh, restY, crossHeight, rest: src.rest, spinAxis: new Vector3(1, i % 3, (i % 2) - 0.5).normalize() };
  });

  // Blender poses, captured once: StrictMode rebuilds the rig after frames
  // have already moved these nodes.
  const base = (o: Object3D) =>
    (o.userData.base ??= { rotZ: o.rotation.z, scale: o.scale.clone() }) as { rotZ: number; scale: Vector3 };

  return {
    tilt,
    tiltZ: base(tilt).rotZ,
    drop,
    dropScale: base(drop).scale,
    splash,
    splashScale: base(splash).scale,
    fallers,
  };
}

type Rig = ReturnType<typeof buildRig>;

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
  const { scene } = useGLTF(MODEL, DRACO);
  const invalidate = useThree((s) => s.invalidate);
  const rigRef = useRef<Rig | null>(null);
  const look = useRef(new Vector3());

  useLayoutEffect(() => {
    const rig = buildRig(scene, lite);
    rigRef.current = rig;
    invalidate();
    return () => {
      for (const f of rig.fallers) scene.remove(f.mesh);
      rigRef.current = null;
    };
  }, [scene, lite, invalidate]);

  useEffect(onReady, [onReady]);

  useFrame(({ camera, size }) => {
    const rig = rigRef.current;
    if (!rig) return;
    const p = progressRef.current ?? 0;

    const exit = jarExit(p);
    rig.tilt.rotation.z = rig.tiltZ * (jarTilt(p) - 0.5 * exit);
    rig.tilt.position.y = LIP_Y + 0.4 * exit;

    const pose = poseAt(p);
    rig.drop.visible = pose.drop.visible;
    rig.drop.scale.set(rig.dropScale.x * pose.drop.thin, rig.dropScale.y * pose.drop.tall, rig.dropScale.z * pose.drop.thin);
    rig.drop.position.y = pose.drop.y;

    // Landscape: slide camera and target together so the drop sits right of
    // centre, easing back to a centred still life as the camera settles.
    const aspect = size.width / size.height;
    const wide = aspect > 1.15 ? 1 - cameraSettle(p) : 0;
    const shiftX = -WIDE_SHIFT * aspect * HALF_FOV * pose.dist * wide;
    look.current.set(shiftX, pose.lookY, 0);
    camera.position.set(shiftX, pose.camY, pose.dist);
    camera.lookAt(look.current);
    // Depth of field holds focus on the drop, then on the cup once it lands.
    focusRef.current.set(0, pose.drop.visible ? pose.drop.y : OIL_SURFACE, 0);

    const s = splashGrow(p);
    rig.splash.visible = s > 0.001;
    rig.splash.scale.set(rig.splashScale.x * (0.6 + 0.4 * s), rig.splashScale.y * s, rig.splashScale.z * (0.6 + 0.4 * s));

    for (const f of rig.fallers) {
      const { height, drift, bounce, spin } = itemFall(p, f.crossAt, f.crossHeight, f.speed);
      f.mesh.position.set(
        f.laneX + (f.x - f.laneX) * drift,
        f.restY + height + 0.035 * bounce,
        f.laneZ + (f.z - f.laneZ) * drift,
      );
      f.mesh.rotation.copy(f.rest);
      if (spin > 0) f.mesh.rotateOnAxis(f.spinAxis, spin * 10);
    }
  });

  return (
    <>
      <primitive object={scene} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.0005}>
        <circleGeometry args={[3, 48]} />
        <meshBasicMaterial color={BACKDROP} toneMapped={false} />
      </mesh>
      {!lite && <ContactShadows position-y={0.0005} scale={0.9} far={0.25} blur={2.2} opacity={0.55} resolution={256} />}
    </>
  );
}

/**
 * Finishing pass: glints bloom off the oil and glass, a vignette and fine
 * grain give it a filmed look. Wide screens add a depth of field locked on
 * the drop, so near olives streak past soft. Weak GPUs skip all of it.
 */
function Effects({ wide, focusRef }: { wide: boolean; focusRef: RefObject<Vector3> }) {
  const dof = useRef<DepthOfFieldEffect>(null);
  useFrame(() => {
    dof.current?.target?.copy(focusRef.current);
  });
  return (
    <EffectComposer multisampling={wide ? 4 : 2}>
      <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.25} intensity={0.55} />
      {wide ? <DepthOfField ref={dof} target={[0, 0, 0]} worldFocusRange={0.22} bokehScale={2.6} /> : null}
      {/* The composer turns off renderer tone mapping; AgX as before. */}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.28} darkness={0.6} />
      <Noise premultiply opacity={0.28} />
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
        camera={{ fov: 40, near: 0.01, far: 10, position: [0, LIP_Y, 0.3] }}
        // Lite skips antialiasing for speed; everyone else gets the composer's MSAA.
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => {
          gl.toneMapping = AgXToneMapping;
          gl.toneMappingExposure = 1.1;
          invalidateRef.current = invalidate;
        }}
        fallback={null}
      >
        {/* Opaque backdrop: the oil needs something real to refract, and
            fog of the same color melts the table into it with no horizon. */}
        <color attach="background" args={[BACKDROP]} />
        <fog attach="fog" args={[BACKDROP, 1.0, 1.9]} />
        <directionalLight position={[-0.9, 0.9, 0.7]} intensity={2.4} color="#fff1dc" />
        <directionalLight position={[0.3, 0.4, -0.6]} intensity={1.6} color="#ffd9a0" />
        <ambientLight intensity={0.25} />
        {/* Soft studio panels for the glass to reflect; rendered once, no network fetch. */}
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} position={[-2, 2, 2]} scale={[3, 2, 1]} />
          <Lightformer form="rect" intensity={2} color="#ffd8a8" position={[2, 1, -2]} scale={[2, 3, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
        </Environment>
        <Suspense fallback={null}>
          <Scene progressRef={progressRef} lite={lite} focusRef={focusRef} onReady={onReady} />
        </Suspense>
        {!lite && <Effects wide={wide} focusRef={focusRef} />}
      </Canvas>
    </>
  );
}

useGLTF.preload(MODEL, DRACO);
