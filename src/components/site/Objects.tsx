"use client";

import AccordionGallery from "@/components/AccordionGallery";
import { objects, objectNotes } from "@/data/site";

export function Objects() {
  return (
    <section id="table" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <h2 className="u-display max-w-2xl text-[clamp(2rem,5vw,3.5rem)] text-char">
          And the things it gets poured into
        </h2>
        <p className="u-measure mt-6 text-lg text-char/75">
          Two carafes and a coaster, made in Lebanon from clay, olive wood and
          cedar. They are the reason the oil ends up on the table instead of
          behind a cupboard door.
        </p>

        <div className="mt-12">
          <AccordionGallery
            items={objects}
            height={560}
            gap={10}
            radius={0}
            expandRatio={0.44}
            accentColor="#C79A4E"
            overlayColor="rgba(12,13,12,0.30)"
            textColor="#E7D6BC"
            trigger="hover"
            showLabels
            grayscale={false}
            parallax={0.5}
            tilt={0}
            className="w-full"
          />
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {objectNotes.map((note) => (
            <div key={note.title}>
              <h3 className="u-display text-lg text-bronze">
                {note.title}
              </h3>
              <div className="u-rule my-3 max-w-24" />
              <p className="text-[0.95rem] leading-relaxed text-char/75">
                {note.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Objects;
