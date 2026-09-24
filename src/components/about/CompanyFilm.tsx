"use client";

import { useRef, useState } from "react";
import type { AboutFilmCopy } from "./copy";
import styles from "./about.module.css";

type Playback = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

export function CompanyFilm({ copy }: { copy: AboutFilmCopy }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<Playback>("idle");
  const showPlay = state === "idle" || state === "ended" || state === "error";

  function play() {
    const video = videoRef.current;
    if (!video) return;
    setState("loading");
    // Attach the source inside the gesture: even metadata stays off the network
    // until the visitor chooses to watch. Keep native range streaming/seeking.
    if (!video.getAttribute("src") || state === "error") {
      video.src = "/film/zurunyaboutvid.mp4";
      video.load();
    }
    if (state === "ended") video.currentTime = 0;
    video.focus({ preventScroll: true });
    void video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState(error instanceof DOMException && error.name === "NotAllowedError" ? "paused" : "error");
    });
  }

  return (
    <figure className={styles.film}>
      <div className={styles.frame}>
        <div className={styles.frameHeading}>
          <span className="u-mono">Zuruny</span>
          <span className={styles.emblem} aria-hidden="true" />
          <span className="u-mono">01:24</span>
        </div>
        <div className={styles.screen}>
          <video
            ref={videoRef}
            data-company-film
            aria-label={copy.filmLabel}
            poster="/film/zuruny-about-poster.webp"
            width={352}
            height={624}
            preload="none"
            playsInline
            controls={state !== "idle"}
            tabIndex={state === "idle" ? -1 : 0}
            onPlay={() => setState("loading")}
            onPlaying={() => setState("playing")}
            onWaiting={() => setState("loading")}
            onPause={() => setState((previous) => previous === "error" ? previous : "paused")}
            onEnded={() => setState("ended")}
            onError={() => setState("error")}
          />
          {showPlay && (
            <div className={styles.playOverlay}>
              <button
                type="button"
                className={styles.playButton}
                onClick={play}
                aria-label={state === "idle" ? copy.playLabel : state === "error" ? copy.retry : copy.replay}
              >
                <span className={styles.playIcon} aria-hidden="true">▶</span>
                <span className="u-mono">{state === "error" ? copy.retry : state === "ended" ? copy.replay : copy.play}</span>
              </button>
              {state === "error" && <p role="alert" className={styles.error}>{copy.error}</p>}
            </div>
          )}
          <div role="status" aria-live="polite" className={state === "loading" ? styles.loading : "sr-only"}>
            {state === "loading" && <><span className={styles.spinner} aria-hidden="true" /><span className="u-mono">{copy.loading}</span></>}
          </div>
        </div>
      </div>
      <noscript><a href="/film/zurunyaboutvid.mp4">{copy.play} · 9.6 MB</a></noscript>
    </figure>
  );
}
