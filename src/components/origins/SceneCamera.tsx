import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Spherical, Vector3 } from "three";
import type { OrbitControls as Controls } from "three-stdlib";

export function SceneCamera({ point, reset, mobile, reduced, active, debugRef, debugInfo, zoom }: {
  point?: Vector3; reset: number; mobile: boolean; reduced: boolean; active: boolean;
  debugRef: RefObject<HTMLPreElement | null>; debugInfo: string; zoom: number;
}) {
  const controls = useRef<Controls>(null);
  const { camera, size, invalidate } = useThree();
  const distance = Math.max(15.8, 11.8 / (size.width / size.height));
  const home = useMemo(() => new Vector3(0, Math.cos(0.57) * distance, Math.sin(0.57) * distance), [distance]);
  const motion = useRef({ flying: false, interacting: false, lastInput: 0, lastDrift: 0, lastDebug: 0, frames: 0 });
  const goalRef = useRef({ target: new Vector3(), position: new Vector3() });
  const offsetRef = useRef(new Vector3());
  const sphericalRef = useRef(new Spherical());

  // Fitting/resizing is immediate. Selection animation is deliberately modest:
  // retain the whole country and move the target only a fraction toward the origin.
  useLayoutEffect(() => {
    camera.position.copy(home);
    controls.current?.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [home, camera, invalidate, reset]);

  useEffect(() => {
    const state = motion.current;
    const goal = goalRef.current;
    state.lastInput = performance.now();
    state.lastDrift = 0;
    if (reduced) {
      state.flying = false;
      const target = controls.current?.target ?? new Vector3();
      camera.position.sub(target).setLength(distance * Math.pow(0.92, zoom)).add(target);
      controls.current?.update();
      invalidate();
      return;
    }
    goal.target.copy(point ?? new Vector3()).multiplyScalar(mobile ? 0.09 : 0.16);
    goal.target.y = 0;
    goal.position.copy(home).multiplyScalar(Math.pow(0.92, zoom)).add(goal.target);
    state.flying = true;
    invalidate();
  }, [point, home, reset, reduced, mobile, zoom, distance, camera, invalidate]);

  // Demand rendering: only request idle frames while visible, at a capped rate.
  // Reduced motion has no timer, drift, damping, or selection fly-to.
  useEffect(() => {
    if (!active || reduced) return;
    const timer = window.setInterval(invalidate, mobile ? 66 : 33);
    return () => window.clearInterval(timer);
  }, [active, reduced, mobile, invalidate]);

  useFrame((_, delta) => {
    const control = controls.current;
    if (!control || !active) return;
    const state = motion.current;
    const goal = goalRef.current;
    const offset = offsetRef.current;
    const spherical = sphericalRef.current;
    const now = performance.now();
    if (state.flying && !state.interacting && !reduced) {
      const alpha = 1 - Math.exp(-Math.min(delta, 0.05) * 5);
      camera.position.lerp(goal.position, alpha);
      control.target.lerp(goal.target, alpha);
      if (camera.position.distanceTo(goal.position) < 0.002) state.flying = false;
      control.update();
      invalidate();
    } else if (!reduced && !state.interacting && now - state.lastInput > 6000) {
      const drift = Math.sin((now - state.lastInput - 6000) / 6500) * (mobile ? 0.008 : 0.022);
      offset.copy(camera.position).sub(control.target);
      spherical.setFromVector3(offset);
      spherical.theta += drift - state.lastDrift;
      state.lastDrift = drift;
      camera.position.copy(offset.setFromSpherical(spherical)).add(control.target);
      control.update();
    }
    if (debugRef.current) {
      state.frames++;
      if (reduced || state.lastDebug === 0 || now - state.lastDebug > 1000) {
        const fps = Math.round(state.frames * 1000 / (now - state.lastDebug));
        const vector = (value: Vector3) => value.toArray().map((n) => n.toFixed(2)).join(", ");
        debugRef.current.textContent = `${debugInfo}\nFPS (rendered): ${fps}\ncamera: ${vector(camera.position)}\ntarget: ${vector(control.target)}`;
        state.frames = 0; state.lastDebug = now;
      }
    }
  });

  return <OrbitControls ref={controls} makeDefault enabled={active}
    enablePan={false} enableZoom={false} enableDamping={!reduced} dampingFactor={0.09}
    rotateSpeed={mobile ? 0.3 : 0.45} minDistance={distance * 0.83} maxDistance={distance * 1.12}
    minPolarAngle={mobile ? 0.48 : 0.4} maxPolarAngle={mobile ? 0.68 : 0.78}
    minAzimuthAngle={mobile ? -0.13 : -0.24} maxAzimuthAngle={mobile ? 0.13 : 0.24}
    onStart={() => { motion.current.interacting = true; motion.current.flying = false; }}
    onEnd={() => { motion.current.interacting = false; motion.current.lastInput = performance.now(); motion.current.lastDrift = 0; }}
  />;
}
