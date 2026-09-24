"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { journalCopy } from "@/data/namesJournalCopy";
import type { Locale } from "@/lib/i18n";
import { useJournal } from "./useJournal";
import styles from "./journal.module.css";

export function JournalExperience({ chapters, locale, children }: {
  chapters: { slug: string; name: string; number: number }[]; locale: Locale; children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState(false);
  const [position, setPosition] = useState({ index: 0, total: 1, chapter: "" });
  const controls = useJournal(root, reading, setPosition);
  const copy = journalCopy[locale];

  function seekChapter(event: MouseEvent<HTMLAnchorElement>, slug: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (controls.current?.chapter(slug)) {
      event.preventDefault();
      window.history.replaceState(null, "", `#${slug}`);
    }
  }

  return <div ref={root} className={styles.experience} data-reading={reading}>
    <div className={styles.stage} data-stage>
      <div className={styles.toolbar}>
        <nav aria-label={copy.contents} className={styles.index}>
          {chapters.map((chapter) => <a href={`#${chapter.slug}`} key={chapter.slug} onClick={(event) => seekChapter(event, chapter.slug)} aria-current={position.chapter === chapter.slug ? "location" : undefined}><span>{String(chapter.number).padStart(2, "0")}</span>{chapter.name}</a>)}
        </nav>
        <button className={styles.readToggle} type="button" aria-pressed={reading} onClick={() => setReading(!reading)}>{reading ? copy.animate : copy.read}</button>
      </div>
      {children}
      <div className={styles.bookControls}>
        <p className={styles.scrollHint}>{copy.scroll} <span aria-hidden="true">↓</span></p>
        <div className={styles.pager} data-pager>
          <button type="button" aria-label={copy.previous} disabled={position.index === 0} onClick={() => controls.current?.page(position.index - 1)}>←</button>
          <span aria-live="polite" aria-atomic="true">{String(position.index + 1).padStart(2, "0")} <span>/ {String(position.total).padStart(2, "0")}</span></span>
          <button type="button" aria-label={copy.next} disabled={position.index === position.total - 1} onClick={() => controls.current?.page(position.index + 1)}>→</button>
        </div>
        <a href="#journal-end" onClick={() => document.getElementById("journal-end")?.focus({ preventScroll: true })}>{copy.skip} <span aria-hidden="true">↘</span></a>
      </div>
    </div>
  </div>;
}
