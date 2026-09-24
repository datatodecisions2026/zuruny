"use client";

import { useEffect, useRef, useState } from "react";
import type { AboutFilmCopy } from "./copy";
import styles from "./about.module.css";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function PotteryBackground({ copy }: { copy: AboutFilmCopy }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [manualPlayback, setManualPlayback] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    let visible = false;

    function syncPlayback() {
      if (!video) return;
      const saveData = connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
      const allowed = manualPlayback ?? (!reduced.matches && !saveData);
      if (visible && !document.hidden && allowed) {
        if (!video.getAttribute("src")) video.src = "/film/zurunyPotter.mp4";
        void video.play().catch(() => { /* Poster remains when autoplay is unavailable. */ });
      } else {
        video.pause();
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 });
    observer.observe(video);
    reduced.addEventListener("change", syncPlayback);
    connection?.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", syncPlayback);
      connection?.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [manualPlayback]);

  return (
    <>
      <div className={styles.backdrop} aria-hidden="true">
        <video
          ref={videoRef}
          data-pottery-film
          poster="/film/zuruny-pottery-poster.webp"
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        />
      </div>
      <div className={styles.backgroundCaption}>
        <span className="u-mono">{copy.background}</span>
        {!failed && <button type="button" aria-label={playing ? copy.pauseBackground : copy.playBackground} onClick={() => setManualPlayback(!playing)}>
          <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
          {playing ? copy.pauseBackground : copy.playBackground}
        </button>}
      </div>
    </>
  );
}
