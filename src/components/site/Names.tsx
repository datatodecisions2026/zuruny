import Image from "next/image";
import Link from "next/link";
import { Quatrefoil } from "./Quatrefoil";
import { people } from "@/data/site";

/**
 * The five names, one screen.
 *
 * This was a pinned scroll-stack carrying each full memory, which ran to
 * roughly seven screens on desktop and ten on mobile. The memories are the
 * best thing here, but they belong where someone has chosen to read them —
 * each product page prints its own in full. The homepage keeps one line.
 */
export function Names() {
  return (
    <section id="names" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <h2 className="u-display max-w-2xl text-[clamp(2rem,5vw,3.25rem)] text-char">
          Every tin carries a person
        </h2>
        <p className="u-measure mt-5 text-lg text-char/75">
          Grandmothers, a great-grandmother, and two men the family lost early.
          The oil is named for them so their names get said out loud in kitchens
          nowhere near Lebanon.
        </p>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:grid-cols-5">
          {people.map((person) => (
            <li key={person.name} className="flex">
              <Link href={person.href} className="group flex w-full flex-col">
                <div className="relative aspect-[3/4] overflow-hidden border border-bronze/20 bg-paper-deep">
                  {person.image ? (
                    <Image
                      src={person.image}
                      alt={`${person.name}, ${person.kind.toLowerCase()}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-oxblood-deep">
                      <Quatrefoil className="h-16 w-16 text-gold/50" />
                    </div>
                  )}
                </div>

                <h3 className="u-display mt-4 text-xl text-char">
                  {person.name}
                </h3>
                <p className="u-spec mt-1 text-char-soft">{person.village}</p>

                <blockquote className="mt-3 text-[0.95rem] leading-relaxed text-char/75">
                  {person.pull}
                </blockquote>

                <span className="mt-auto pt-3 inline-block self-start text-sm tracking-[0.12em] text-bronze underline decoration-bronze/30 underline-offset-[6px] transition-colors group-hover:text-char">
                  Read the story
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Names;
