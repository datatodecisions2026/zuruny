"use client";

import { useEffect, useRef, type RefObject } from "react";
import { JOURNAL_TURN, journalStops } from "@/data/namesJournal";

type Position = { index: number; total: number; chapter: string };
type Controls = { chapter: (slug: string) => boolean; page: (index: number) => void };

export function useJournal(root: RefObject<HTMLDivElement | null>, reading: boolean, onPosition: (position: Position) => void) {
  const controls = useRef<Controls | null>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => {};
    // Static HTML remains readable even if the animation module cannot load.
    async function start() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed || !element) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      cleanup = () => media.revert();
      media.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)", reduce: "(prefers-reduced-motion: reduce)", short: "(max-height: 649px)" }, (context) => {
        const leaves = Array.from(element.querySelectorAll<HTMLElement>("[data-leaf]"));
        const reset = () => {
          delete element.dataset.enhanced;
          controls.current = null;
          leaves.forEach((leaf) => { leaf.inert = false; leaf.removeAttribute("aria-hidden"); });
        };
        if (reading || context.conditions?.reduce || context.conditions?.short) {
          reset();
          const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) onPosition({ index: 0, total: 1, chapter: (visible.target as HTMLElement).dataset.chapter ?? "" });
          }, { rootMargin: "-20% 0px -35% 0px", threshold: [0, 0.25, 0.5] });
          element.querySelectorAll("[data-kind='dedication']").forEach((leaf) => observer.observe(leaf));
          return () => observer.disconnect();
        }
        const desktop = context.conditions?.desktop;
        const stage = element.querySelector<HTMLElement>("[data-stage]")!;
        const book = element.querySelector<HTMLElement>("[data-book]")!;
        const units = desktop ? Array.from(element.querySelectorAll<HTMLElement>("[data-spread]")) : leaves;
        const stops = journalStops(units.length);
        element.dataset.enhanced = "true";
        gsap.set(units, { autoAlpha: 0, zIndex: (i) => units.length - i });
        gsap.set(units[0], { autoAlpha: 1 });
        if (desktop) gsap.set(book, { xPercent: -25 });
        let current = -1;
        const timeline = gsap.timeline({ defaults: { ease: "none" }, onUpdate: () => {
          const index = Math.min(units.length - 1, Math.floor(timeline.time() + 0.015));
          if (index === current) return;
          current = index;
          const visible = desktop ? Array.from(units[index].querySelectorAll<HTMLElement>("[data-leaf]")) : [units[index]];
          leaves.forEach((leaf) => { const active = visible.includes(leaf); leaf.inert = !active; leaf.setAttribute("aria-hidden", String(!active)); });
          onPosition({ index, total: units.length, chapter: units[index].dataset.chapter ?? "" });
        } });
        units.slice(0, -1).forEach((unit, index) => {
          const at = stops[index] + JOURNAL_TURN.hold;
          const turn = desktop ? unit.querySelector<HTMLElement>("[data-leaf]:last-child")! : unit;
          const left = desktop ? unit.querySelector<HTMLElement>("[data-leaf]:first-child") : null;
          timeline.set(units[index + 1], { autoAlpha: 1 }, at);
          timeline.to(turn, { rotationY: -180, duration: JOURNAL_TURN.duration, ease: "power1.inOut" }, at);
          timeline.to(turn, { z: 12, skewY: -1.2, "--fold": 0.3, duration: JOURNAL_TURN.duration / 2 }, at);
          timeline.to(turn, { z: 0, skewY: 0, "--fold": 0, duration: JOURNAL_TURN.duration / 2 }, at + JOURNAL_TURN.duration / 2);
          if (left && left !== turn) timeline.to(left, { autoAlpha: 0, duration: 0.08 }, at + JOURNAL_TURN.duration / 2);
          timeline.set(unit, { autoAlpha: 0 }, stops[index + 1]);
          if (index === 0 && desktop) timeline.to(book, { xPercent: 0, duration: JOURNAL_TURN.duration }, at);
        });
        timeline.to({}, { duration: JOURNAL_TURN.hold });
        const trigger = ScrollTrigger.create({
          trigger: element, pin: stage, animation: timeline, start: "top top", end: () => `+=${units.length * Math.max(480, window.innerHeight * 0.8)}`,
          scrub: 0.45, invalidateOnRefresh: true, anticipatePin: 1,
        });
        function seek(index: number) {
          const safe = Math.max(0, Math.min(index, units.length - 1));
          window.scrollTo({ top: trigger.start + (stops[safe] + 0.08) / timeline.duration() * (trigger.end - trigger.start), behavior: "instant" });
        }
        controls.current = {
          page: seek,
          chapter: (slug) => {
            const index = units.findIndex((unit) => unit.dataset.chapter === slug);
            if (index < 0) return false;
            seek(index);
            return true;
          },
        };
        const hash = decodeURIComponent(window.location.hash.slice(1));
        if (hash) controls.current.chapter(hash);
        const hashChange = () => controls.current?.chapter(decodeURIComponent(window.location.hash.slice(1)));
        window.addEventListener("hashchange", hashChange);
        // Set initial accessibility before the first scroll frame.
        leaves.forEach((leaf, i) => { leaf.inert = i !== 0; leaf.setAttribute("aria-hidden", String(i !== 0)); });
        onPosition({ index: 0, total: units.length, chapter: "" });
        return () => { window.removeEventListener("hashchange", hashChange); reset(); };
      }, element);
    }
    start().catch(() => { delete element.dataset.enhanced; });
    return () => { disposed = true; cleanup(); };
  }, [root, reading, onPosition]);
  return controls;
}
