==============================================================================
ZURUNY — SITE KIT
Everything needed to rebuild the site from scratch.
==============================================================================

WHAT IS IN THIS FOLDER

  README.txt      this file — the brand, the brief, the rules
  PRODUCTS.txt    all 10 products: prices, stock, descriptions, stories
  IMAGES.txt      what every image file is, and where it should be used
  images/         28 photographs and brand assets
  film/           an 8-second brand film + poster frame

Nothing else from the old build was kept. Start here.


==============================================================================
1. WHAT THE SITE IS
==============================================================================

Zuruny is a small Lebanese food and homeware brand based in Beirut. It sells
single-origin olive oil, carob and grape molasses, two ceramic carafes and a
cedar coaster. It ships to 29 countries.

The company is real and already trading. The site's job is to sell these ten
products and to tell the story behind them.

WHO IT IS FOR
  Mainly the Lebanese diaspora — people who left and want a piece of home in
  their kitchen. Secondarily, food-lovers who care where things come from.
  Prices are in USD and most orders leave Lebanon.

WHAT MAKES IT DIFFERENT
  Every oil is named after a real member of the founder's family, and each one
  carries the founder's own written memory of that person. These memories are
  in PRODUCTS.txt and they are the single best asset the brand has. They are
  genuinely moving and they are not marketing copy. Do not rewrite them, do
  not shorten them into slogans, and do not let a design bury them.

  A second, separate fact: each oil is pressed in a named village by a named
  family. The person the oil is named after and the village it is pressed in
  are usually DIFFERENT places. Keep those two facts apart — conflating them
  invents things that are not true.

WHAT THE SITE MUST DO
  - Show 10 products with prices and let people buy them
  - Carry the stories properly
  - Work well on a phone; a lot of the audience is on one
  - Have an admin area so the owner can add and edit products without a dev


==============================================================================
2. HARD RULES
==============================================================================

  * NO ARABIC TEXT ANYWHERE.
    The previous build used the Arabic spelling of the brand name and an
    Arabic marquee. All of it is removed. English only.

  * Do not claim a product is for sale if it has no price.
    Four products currently have no price set. They must not show a working
    "add to cart".

  * Do not invent product photography.
    Some products have no photograph at all. That is a real gap. Design an
    honest empty state rather than substituting a stock image or an unrelated
    picture.

  * Money is stored in integer cents, never floats.


==============================================================================
3. THE BRAND
==============================================================================

There is a professional brand deck by Yasmina Terzikhan (2025). These values
come from it, so they are authoritative — not guesses sampled from photos.

THE MARK
  A quatrefoil (four-lobed frame) containing a stylised olive tree, with the
  wordmark ZURUNY beneath it in an inscriptional serif. Supplied here as:
    images/brand/emblem.png        white silhouette on transparent — use as a
                                   CSS mask so it can be tinted any colour
    images/brand/emblem-mark.png   the same mark, pre-tinted oxblood
    images/brand/logo-lockup.png   emblem + ZURUNY wordmark together

COLOUR — the deck offers two palettes. Pick one, do not mix them.

  Palette A — wine & olive
    #51110F   oxblood      primary, buttons
    #6D2636   wine         accents, links
    #EAD4D6   blush        a small accent only
    #FEF9E9   cream        page background
    #6E7A3F   olive        secondary
    #252616   near-black   body text
    #A9C1C9   dusty blue   a small accent only

  Palette B — olive & ochre
    #4F0D0F   oxblood
    #732530   raspberry
    #817F3C   olive
    #666B32   deep olive
    #F8F5D3   cream
    #D7A739   ochre        decorative only

  CONTRAST WARNINGS (measured, not guessed)
    - On cream, the gold/ochre tones fail badly (~2:1). Never use them for
      text on a light background. Decorative use over dark images only.
    - Blush (#EAD4D6) is an accent. The previous build used it as a major
      surface for the footer and empty states and it looked cheap and pink.
    - On an oxblood button, use cream text (11:1), never gold or bronze.

PATTERNS — from the deck, supplied here:
    images/brand/pattern-sprig.png    small leaf sprig, tiles seamlessly.
                                      Good as a very faint page texture
                                      (around 4% opacity). Tested and clean.
    images/brand/pattern-damask.png   large damask scroll. Suits one contained
                                      dark panel. It does NOT tile seamlessly
                                      enough for a full-page background.

  Both are white-on-transparent, so tint them with a CSS mask.

TYPOGRAPHY
  The tins use an inscriptional roman for names, and a typewriter face for the
  small spec strip ("100% Natural - Cold Pressed / Acidity: <0.5%"). The
  previous build used Cinzel + EB Garamond + Courier Prime, which was faithful
  but ended up feeling stiff and old-fashioned. You are free to choose again.

THE PHOTOGRAPHY IS THE BEST THING YOU HAVE
  It is dark, moody, Old-Master-style still life — deep shadow, oxblood and
  black grounds, gold rims catching light. Whatever direction you take, build
  around these images. On a light background they read as framed plates; on a
  dark background they bleed edge to edge. Both work. See IMAGES.txt.


==============================================================================
4. WHAT WENT WRONG LAST TIME
==============================================================================

Written down so it is not repeated. The client's verdict on the previous
build was blunt: the design did not work.

  - It leaned hard on a heritage/antique look — inscriptional caps, cream
    paper, wallpaper pattern, film grain. It read as dated rather than
    considered.
  - Too many animated components were used at once: a melting image slider,
    a pinned scroll-stack, a WebGL circular gallery, a hover accordion, a
    curved marquee. Individually fine, together it was a components demo.
  - A pinned scroll section ran to nearly 7 screens on desktop and 10 on
    mobile for 5 products.
  - Blush pink was promoted from a minor accent to a major surface.
  - Arabic text was used decoratively.

  Suggestion, not instruction: the products are dark, jewel-like and
  expensive-looking. A quieter, more modern, more confident layout that lets
  the photography carry the page would probably serve them better than
  period styling.


==============================================================================
5. FACTS YOU WILL NEED
==============================================================================

  Brand name      Zuruny
  Based           Beirut, Lebanon
  Contact         hello@zuruny.co
  Currency        USD
  Old domain      zuruny.co  (was a Shopify store)
  Ships to        29 countries: Lebanon, United States, Canada, United
                  Kingdom, France, Germany, Belgium, Netherlands, Spain,
                  Portugal, Italy, Switzerland, Austria, Denmark, Sweden,
                  Norway, Finland, Ireland, Poland, Czechia, Israel, United
                  Arab Emirates, Australia, New Zealand, Japan, South Korea,
                  Hong Kong, Singapore, Malaysia

  PRODUCT MIX     5 olive oils (3 with photos, 2 without)
                  2 molasses — carob and grape (no photos)
                  2 ceramic carafes (well photographed)
                  1 cedar coaster (well photographed)

  STATE OF PRICES 6 products priced, 4 with no price set at all.
                  2 priced products are out of stock.
                  See PRODUCTS.txt for the exact position.

  PAYMENTS        Not built. The previous version handed checkout to Shopify;
                  the client has since decided to build their own. Until a
                  payment provider is wired up the site cannot take money.


==============================================================================
6. THE MEMORIES — READ THESE FIRST
==============================================================================

Before designing anything, read the five stories in PRODUCTS.txt. They are
about a grandmother called Najo, a great-grandmother nobody living met, a
family who have phoned each other every day since Skype was invented, a
grandfather the founder never knew, and a man who filled a suitcase with
walnuts. They tell you what this brand actually is, which no colour palette
will.
