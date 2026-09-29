"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Text, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import {
  AgXToneMapping,
  Box3,
  Color,
  Euler,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector2,
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
  smoothstep,
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
// Headline that sits behind the falling olives and scrolls up past the camera
// (parallax). Placed where the camera is at TEXT_AT, fades before the still life.
const TEXT_AT = 0.62;
const TEXT_Z = -0.22;
const TEXT_WIDTH = 0.5; // natural width of the longest line at TEXT_SIZE, scaled to the view
const TEXT_SIZE = 0.11;
const FONT = "/fonts/instrument-serif-400.woff";
// Seamless studio sweep, after the burgundy backdrop in oil_drop_new.mp4.
const BACKDROP = "#5c1a27";

// Falling olives and sprigs. Each rests at (x, z) on the table, clear of the
// cup (0,0), decanter (0.15,-0.2) and plate (-0.1,0.085), and falls in a lane
// through the drop's camera view at crossAt. `lane` is -1..1 across the view
// width at that depth (so it holds edge to edge on any aspect, haphazardly, some
// cropped by the frame); laneZ sets depth: nearer sweeps past faster (parallax),
// and lanes in front of TEXT_Z pass over the headline, the rest behind it.
const FALLERS: { kind: "olive" | "sprig"; x: number; z: number; crossAt: number; speed: number; lane: number; laneZ: number }[] = [
  { kind: "olive", x: 0.07, z: 0.07, crossAt: 0.17, speed: 2.2, lane: -0.7, laneZ: 0.12 },
  { kind: "olive", x: 0.1, z: 0.16, crossAt: 0.22, speed: 1.8, lane: 0.92, laneZ: -0.3 },
  { kind: "sprig", x: 0.02, z: 0.28, crossAt: 0.27, speed: 2, lane: -0.95, laneZ: -0.2 },
  { kind: "olive", x: 0.03, z: 0.2, crossAt: 0.31, speed: 2.6, lane: 0.55, laneZ: 0.15 },
  { kind: "olive", x: -0.05, z: 0.24, crossAt: 0.35, speed: 1.7, lane: -0.3, laneZ: -0.35 },
  { kind: "olive", x: -0.2, z: 0.15, crossAt: 0.39, speed: 2.3, lane: 1.02, laneZ: 0.05 },
  { kind: "olive", x: 0.12, z: 0.26, crossAt: 0.43, speed: 2.1, lane: -1.02, laneZ: -0.1 },
  { kind: "sprig", x: 0.1, z: 0.11, crossAt: 0.47, speed: 2.4, lane: 0.3, laneZ: 0.1 },
  { kind: "olive", x: -0.11, z: 0.22, crossAt: 0.51, speed: 1.8, lane: -0.62, laneZ: -0.4 },
  { kind: "olive", x: 0.22, z: 0.12, crossAt: 0.54, speed: 1.9, lane: 0.8, laneZ: 0.1 },
  { kind: "olive", x: 0.06, z: 0.3, crossAt: 0.57, speed: 1.6, lane: 0.05, laneZ: -0.38 },
  { kind: "olive", x: 0, z: 0.13, crossAt: 0.6, speed: 1.5, lane: -0.88, laneZ: 0.13 },
  { kind: "olive", x: 0.14, z: 0.05, crossAt: 0.63, speed: 1.4, lane: 0.98, laneZ: -0.28 },
  { kind: "olive", x: -0.16, z: 0.34, crossAt: 0.66, speed: 1.6, lane: -0.4, laneZ: 0.08 },
  { kind: "olive", x: -0.08, z: 0.31, crossAt: 0.7, speed: 1.3, lane: 0.42, laneZ: -0.12 },
  { kind: "olive", x: 0.18, z: 0.33, crossAt: 0.74, speed: 1.3, lane: -0.15, laneZ: 0.14 },
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
      oil: new MeshStandardMaterial({ color: "#e0a526", roughness: 0.04, transparent: true, opacity: 0.85 }),
      drop: new MeshStandardMaterial({ color: "#eab12c", roughness: 0.03, transparent: true, opacity: 0.92 }),
      glass: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.02, transparent: true, opacity: 0.18, depthWrite: false }),
    };
  }
  return {
    // Oil inside the glassware (cup, decanter, splash). Solid glossy gold, not
    // transmissive: through the post-processing chain the transmission pass
    // washed it to cream, and behind glass a rich solid gold reads better.
    oil: new MeshPhysicalMaterial({
      // Premium gold, kept apart from the green-khaki olives. Deep amber in:
      // AgX pulls bright yellows to cream, so this lands on gold.
      color: "#c9860c",
      roughness: 0.02,
      clearcoat: 0.3,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.35, // flat oil surfaces otherwise mirror the studio panels
    }),
    // A falling drop is too thin to tint what it refracts on its own, so the
    // gold attenuation is tuned short to color it through; a warm specular
    // and faint inner glow give the premium, lit-from-within read.
    drop: new MeshPhysicalMaterial({
      color: "#d9960f",
      transmission: 0.45,
      ior: 1.47,
      thickness: 0.012,
      roughness: 0.015,
      attenuationColor: new Color("#d68a0c"),
      attenuationDistance: 0.015,
      specularColor: new Color("#ffe3a3"),
      specularIntensity: 1,
      emissive: new Color("#5a2e00"),
      emissiveIntensity: 0.3,
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
      opacity: 0.08,
      depthWrite: false,
      // Kept under the Bloom threshold: brighter cut-glass glints bloom into a
      // haze that turns the oil inside to cream.
      envMapIntensity: 1.1,
      clearcoat: 0.5,
    }),
  };
}

/**
 * Classic teardrop profile, x = sin t · sin²(t/2), lathed. Bottom sits at
 * y = 0 (like the Blender drop's pivot), DROP_H tall, 0.7 × as wide.
 */
function teardropGeometry() {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI; // 0 = tip, π = rounded bottom
    const r = 0.54 * Math.sin(t) * Math.sin(t / 2) ** 2;
    pts.push(new Vector2(r * DROP_H, ((1 + Math.cos(t)) / 2) * DROP_H));
  }
  return new LatheGeometry(pts, 48);
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
  // The Blender drop has a splash crater modelled into its base, so it is
  // replaced by a clean lathed teardrop: rounded bottom, pointed tip.
  get("ZU_Drop").visible = false;
  const drop = new Mesh(teardropGeometry(), mats.drop);
  scene.add(drop);
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
    return { ...f, mesh, restY, crossHeight, crossDist: poseAt(f.crossAt).dist, rest: src.rest, spinAxis: new Vector3(1, i % 3, (i % 2) - 0.5).normalize() };
  });

  // Blender poses, captured once: StrictMode rebuilds the rig after frames
  // have already moved these nodes.
  const base = (o: Object3D) =>
    (o.userData.base ??= { rotZ: o.rotation.z, scale: o.scale.clone() }) as { rotZ: number; scale: Vector3 };

  return {
    tilt,
    tiltZ: base(tilt).rotZ,
    drop,
    dropScale: new Vector3(1, 1, 1),
    textY: poseAt(TEXT_AT).lookY,
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
  backdrop,
}: {
  backdrop: string;
  progressRef: RefObject<number>;
  lite: boolean;
  focusRef: RefObject<Vector3>;
  onReady: () => void;
}) {
  const { scene } = useGLTF(MODEL, DRACO);
  const invalidate = useThree((s) => s.invalidate);
  const rigRef = useRef<Rig | null>(null);
  const look = useRef(new Vector3());
  const textRef = useRef<Mesh & { fillOpacity: number }>(null);

  useLayoutEffect(() => {
    const rig = buildRig(scene, lite);
    rigRef.current = rig;
    invalidate();
    return () => {
      for (const f of rig.fallers) scene.remove(f.mesh);
      scene.remove(rig.drop);
      rigRef.current = null;
    };
  }, [scene, lite, invalidate]);

  useEffect(onReady, [onReady]);

  useFrame(({ camera, size }) => {
    const aspect = size.width / size.height;
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

    look.current.set(0, pose.lookY, 0);
    camera.position.set(0, pose.camY, pose.dist);
    camera.lookAt(look.current);
    // Depth of field holds focus on the drop, then on the cup once it lands.
    focusRef.current.set(0, pose.drop.visible ? pose.drop.y : OIL_SURFACE, 0);

    const s = splashGrow(p);
    rig.splash.visible = s > 0.001;
    rig.splash.scale.set(rig.splashScale.x * (0.6 + 0.4 * s), rig.splashScale.y * s, rig.splashScale.z * (0.6 + 0.4 * s));

    for (const f of rig.fallers) {
      const { height, drift, bounce, spin } = itemFall(p, f.crossAt, f.crossHeight, f.speed);
      const laneX = f.lane * aspect * HALF_FOV * (f.crossDist - f.laneZ);
      f.mesh.position.set(
        laneX + (f.x - laneX) * drift,
        f.restY + height + 0.035 * bounce,
        f.laneZ + (f.z - f.laneZ) * drift,
      );
      f.mesh.rotation.copy(f.rest);
      if (spin > 0) f.mesh.rotateOnAxis(f.spinAxis, spin * 10);
    }

    // Headline: sized to the view at its depth, fades out before the still life.
    const text = textRef.current;
    if (text) {
      const viewW = 2 * aspect * HALF_FOV * (FOLLOW_DIST - TEXT_Z);
      text.scale.setScalar(((aspect < 1 ? 0.85 : 0.6) * viewW) / TEXT_WIDTH);
      text.position.set(0, rig.textY, TEXT_Z);
      text.fillOpacity = 0.92 * (1 - smoothstep((p - 0.7) / 0.1));
      text.visible = text.fillOpacity > 0.01;
    }
  });

  return (
    <>
      <primitive object={scene} />
      <Text
        ref={textRef}
        font={FONT}
        fontSize={TEXT_SIZE}
        lineHeight={0.95}
        maxWidth={TEXT_WIDTH}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#f3e6c8"
        material-toneMapped={false}
      >
        {backdrop}
      </Text>
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
  backdrop,
  progressRef,
  invalidateRef,
  onReady,
  onProgress,
}: {
  backdrop: string;
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
          <Scene progressRef={progressRef} lite={lite} focusRef={focusRef} onReady={onReady} backdrop={backdrop} />
        </Suspense>
        {!lite && <Effects wide={wide} focusRef={focusRef} />}
      </Canvas>
    </>
  );
}

useGLTF.preload(MODEL, DRACO);
