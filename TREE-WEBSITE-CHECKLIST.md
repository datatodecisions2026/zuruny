# Site vs. "TREE WEBSITE" brief — fix checklist

Source of truth being compared against: `public/assets/TREE WEBSITE .pdf`.
Ordered roughly easiest/safest → biggest.

**Legend:** `[x]` done · `[~]` partly done, rest is genuinely blocked ·
`[ ]` not started — every one of these has a bolded reason why, right
under it.

**Progress: 12 of 22 items done, 1 in progress, 9 blocked or deferred.**
Everything still open is stuck on one of three things: real pricing data,
real content (recipes/news/bios/social links) that doesn't exist yet, or a
decision only you can make (newsletter mechanism, memory-text source of
truth). Nothing is unfinished because it was skipped — see each item's
explanation below.

---

## 1. Factual fixes (quick, high confidence)

- [x] **Malvina `namedAfterFrom` is wrong.** ~~Currently `"Deir Mimas"`~~ →
      fixed to **Achrafieh**, matching the PDF, in
      [src/lib/catalog.ts:52](src/lib/catalog.ts#L52). This also fixed the
      violation of the codebase's own rule at
      [catalog.ts:12-13](src/lib/catalog.ts#L12-L13) that `namedAfterFrom` and
      `spec.village` must never be the same place.

- [x] **Georges `namedAfterFrom` is wrong.** ~~Currently `"Beirut"`~~ → fixed
      to **Ebel el Saqi**, matching the PDF, in
      [src/lib/catalog.ts:113](src/lib/catalog.ts#L113).

- [x] **Fayez `namedAfterFrom` is too vague.** ~~Currently `"Lebanon"`~~ →
      fixed to **Mehmarch**, matching the PDF, in
      [src/lib/catalog.ts:132](src/lib/catalog.ts#L132).

- [x] **Em Ramiz oil village region label.** Was
      `"Aabra, South Lebanon"` ([catalog.ts:93](src/lib/catalog.ts#L93)); the
      PDF itself labels it **Aabra (Chouf)** — Chouf is Mount Lebanon
      Governorate, not South Lebanon. Fixed to `"Aabra, Chouf"` everywhere it
      appeared: the EN/FR spec tables, the EN/FR product descriptions, and
      the EN/FR film captions in `i18n.ts`.

---

## 2. Missing product spec fields

- [x] **Malvina spec table** — added `Altitude: 400–500 m`, `Variety:
      Baladi`, and `Best use: Kitchen & Table Olive Oil (CAT 2)` to the
      `spec` array in [catalog.ts](src/lib/catalog.ts) and the matching FR
      row in [catalog.fr.ts](src/lib/catalog.fr.ts).

- [x] **Em Ramiz spec table** — added `Altitude: 150 m`, `Variety:
      Frontoio`, `Best use: Table & Finishing Olive Oil`, and folded the
      crop date into the existing `Harvest` field ("Early — September
      2025") rather than adding a redundant row. Same in both
      [catalog.ts](src/lib/catalog.ts) and
      [catalog.fr.ts](src/lib/catalog.fr.ts).

- [x] **Georges (carob molasses) spec table** — added `Village: Rihane`,
      `Diet: Vegan, gluten-free`, a `Storage` field, and a `How to taste it`
      field summarizing the PDF's bullet list. Done in both
      [catalog.ts](src/lib/catalog.ts) and
      [catalog.fr.ts](src/lib/catalog.fr.ts).

- [x] **Fayez (grape molasses) spec table** — added `Village: Rachaya`,
      `Preservatives: None`, `Diet: Vegan, gluten-free`, a `Storage` field,
      and a `How to taste it` field. Note: the PDF's "Traditionally crafted"
      badge was folded into the existing `Method` field rather than given
      its own row — revisit if you want it called out separately. Done in
      both [catalog.ts](src/lib/catalog.ts) and
      [catalog.fr.ts](src/lib/catalog.fr.ts).

---

## 3. Missing size/price options

- [~] **Malvina and Em Ramiz now have the 250 ml / 1 L / 3 L structure —
      but only one tier is actually priced.** Both were single-variant
      products with no size recorded against their price. Restructured in
      [catalog.ts:81-89](src/lib/catalog.ts#L81-L89) (Malvina) and
      [catalog.ts:120-126](src/lib/catalog.ts#L120-L126) (Em Ramiz):
      - The existing price ($28 Malvina, $10 Em Ramiz) was **assumed** to be
        the 250 ml tier and kept sellable at that size — this was a guess,
        not confirmed data, since nothing recorded which size it was for.
      - 1 L and 3 L were added as real variants with `priceCents: null`,
        so they render honestly as unpriced/unbuyable rather than
        disappearing or defaulting to $0.
      - **⚠️ TODO when you have real numbers:** (1) confirm the 250 ml
        price is actually correct for that size, and (2) fill in real
        `priceCents`/`stock` for the 1 L and 3 L variants on both
        products, then flip `available: true`. Both spots are marked with
        an inline `CONFIRM with founder` comment in the code so they're
        easy to grep for later.

- [ ] **Najibe is written but not live.** It's fully fleshed out
      (description, memory, spec, and already has the correct 250 ml/1 L/3 L
      variant shape) but `status: "draft"` keeps it off the site entirely
      ([catalog.ts:271](src/lib/catalog.ts#L271), variants at
      [catalog.ts:298-302](src/lib/catalog.ts#L298-L302)). **Blocked: same
      as above** — every variant is `priceCents: null`, so it needs real
      prices before it can ship. Left untouched rather than guessed, since
      unlike Malvina/Em Ramiz there was no pre-existing price to carry over
      at all. Decide if/when it should ship, then flip `status` to
      `"active"`.

---

## 4. Missing pages / nav destinations

- [x] **Our Artisans page** — built at
      [src/app/[locale]/artisans/page.tsx](src/app/[locale]/artisans/page.tsx),
      wired into both the desktop nav
      ([SiteHeader.tsx](src/components/SiteHeader.tsx)) and the mobile menu
      ([MobileMenu.tsx](src/components/MobileMenu.tsx)), copy added to
      [i18n.ts](src/lib/i18n.ts) (EN + FR). Lists the three names from the
      PDF — Jihad Samia, Christopher Ghoussoub, Omar Gabriel — each with a
      "Bio coming soon" placeholder, since the PDF gives no craft, photo, or
      bio for any of them. **Come back and fill in real bios/photos once you
      have them**, same pattern as the draft products' "Coming soon."

- [ ] **Recipes page** — not implemented. **Blocked: needs actual recipe
      content**, which doesn't exist anywhere yet (not in the PDF, not in
      the codebase). Can't build this without real recipes from you.

- [ ] **Upcoming News page/section** — not implemented. **Blocked: same
      issue** — needs real news content to post, which doesn't exist yet.

- [ ] **Our Online Presence** — Instagram / Pinterest / YouTube links. None
      exist in [SiteHeader.tsx](src/components/SiteHeader.tsx),
      [SiteFooter.tsx](src/components/SiteFooter.tsx), or
      [MobileMenu.tsx](src/components/MobileMenu.tsx). **Blocked: needs the
      real handles/URLs** — a placeholder link would be actively wrong
      (either 404s or points somewhere unintended), so this wasn't guessed.

- [ ] **Newsletter signup** — PDF: "WE SEND TASTY EMAILS: put email." No
      email-capture field exists on the site. **Needs a decision before
      building**: the site already has Supabase wired up for accounts/orders
      ([src/lib/supabase/server.ts](src/lib/supabase/server.ts)), so a real
      capture form backed by a new `subscribers` table is the natural fit —
      but that's a schema change to shared infrastructure, so it wasn't done
      without checking first. Alternative: a lighter-weight `mailto:` "get in
      touch to join" link, matching the pattern already used for
      out-of-stock notices in
      [AddToCart.tsx](src/components/AddToCart.tsx#L46-L53), which is
      real today but isn't self-serve. Tell me which you want.

- [ ] **"Echoes of Lebanon" photography prints** under Zuruny Collection —
      only the Coaster exists today. **Blocked: needs real product
      photography and pricing**, same as Najibe in step 3.
- [ ] **Catalogue mega-nav by region** (Akkar, Kesrouan Jbeil, Beyrouth,
      Bekaa, Nabatieh, South Lebanon, etc.) — live nav is just Shop / The
      Names / Artisans / About / Shipping
      ([SiteHeader.tsx:25-30](src/components/SiteHeader.tsx#L25-L30)).
      **Deferred, not blocked** — this is a priority call, not a data gap:
      most of those regions have zero live products, so a mega-menu would
      mostly link to empty categories. Revisit once more oils ship.

---

## 5. Missing "About Zuruny" brand story

- [x] **About page built** at
      [src/app/[locale]/about/page.tsx](src/app/[locale]/about/page.tsx),
      wired into the desktop nav ([SiteHeader.tsx](src/components/SiteHeader.tsx))
      and mobile menu ([MobileMenu.tsx](src/components/MobileMenu.tsx)).
      Carries every section from the PDF verbatim: the kicker ("Taste the
      land..."), "A land of sun, soil, and stories," "Craft that holds a
      soul," "More than olive oil," "For those who stayed and those who
      roam," "What we protect," "A future built on roots and creation," and
      the closing line — full EN + FR copy in
      [i18n.ts](src/lib/i18n.ts) (`about` block). FR is a translation I
      wrote, not the founder's own words — this is marketing/brand copy,
      not one of the `memory` fields, so it follows the same
      translate-it-like-the-rest-of-the-UI pattern already used for hero,
      ledger, and reach. Flag it if you'd rather have her own French pass.

- [x] **Product-line taglines added.** "Where nature meets meaning" (olive
      oil), "Where heritage meets taste" (both molasses), "Where craft
      meets heart" (carafe) — shown as a small kicker line on each
      product's detail page, sourced from `t.kindTagline` in
      [i18n.ts](src/lib/i18n.ts) and rendered in
      [products/[handle]/page.tsx](src/app/[locale]/products/[handle]/page.tsx#L112-L116).
      No tagline exists for coasters — the PDF's "Zuruny Collection" line
      never gave it one, so nothing was invented there.

- [x] **Carafe provenance line added** — "Handcrafted in Beit Chabeb and
      Douma" is now a `Craft` row in the spec table for both Tantour and
      Bri' Zeit, EN ([catalog.ts](src/lib/catalog.ts)) and FR
      ([catalog.fr.ts](src/lib/catalog.fr.ts)).

---

## 6. Needs a decision before touching — the memory texts

**Do not edit until you've settled this.** The `memory` field for
**Malvina, Em Ramiz, Georges, and Fayez** in `catalog.ts` tells a
noticeably different story than the "More to know about..." text in the
PDF for each of them — not trimmed, actually different anecdotes and
details (e.g. PDF's Malvina text is about her piano-playing, daily Mass,
and being from Achrafieh; the live site's Malvina text is about never
having known the grandfather and honoring "the woman who gave him life").

- [ ] Confirm with the founder which version is current: the PDF, or what's
      already live in
      [catalog.ts:56, 89, 117, 136](src/lib/catalog.ts#L56).
- [ ] Once confirmed, update whichever side is outdated. This field is
      flagged in the code comments as "the founder's own writing,
      reproduced verbatim" — don't paraphrase either version, swap it in
      exactly as given.
