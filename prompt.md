PROJECT: ZURUNY WEBSITE — FULL CINEMATIC REDESIGN

You are working inside an EXISTING ZURUNY website project.

This is NOT a new project.

Do not create a second website.
Do not scaffold a replacement application.
Do not throw away existing functionality.

First inspect the entire existing project carefully:
- framework and routing
- current homepage
- current hero section
- navigation
- typography
- global styles
- logo and brand assets
- product assets
- current sections and copy
- ecommerce/shop functionality if present
- reusable components
- existing animation libraries
- existing responsive behavior
- dependencies
- performance configuration

Understand the existing implementation before making architectural decisions.

The objective is to completely redesign the public-facing homepage/landing experience while preserving existing useful functionality, brand assets, content and routes.

==================================================
NEW CORE EXPERIENCE
==================================================

The redesigned homepage is an immersive story about ZURUNY olive oil.

The visitor should feel like they travel:

ANCIENT OLIVE TREE
→ INTO THE TREE
→ THROUGH THE OLIVE CANOPY
→ INTO THE ESSENCE OF THE OLIVE
→ FOLLOW ONE GOLDEN OLIVE-OIL DROPLET
→ THE DROPLET ARRIVES AT THE GLASS
→ ZURUNY PRODUCT / CTA

This is the visual and storytelling backbone of the homepage.

It should not feel like a conventional ecommerce template.

It should feel like:
- cinematic editorial storytelling
- Lebanese heritage
- premium olive-oil branding
- an interactive luxury product film
- a calm game-lobby environment when idle
- an immersive scroll journey when moving

Do not create generic SaaS sections.
Do not use generic card grids everywhere.
Do not use glassmorphism.
Do not introduce unrelated gradients.
Do not turn it into a tech website.

==================================================
EXISTING VIDEO ASSETS
==================================================

A folder already exists in the project:

hero_scenes/

It contains:

DESKTOP

hero_scenes/tree_idle_new.mp4
hero_scenes/tree_intro_new.mp4
hero_scenes/tree_canopy_new.mp4
hero_scenes/oil_drop_new.mp4

MOBILE

hero_scenes/tree_idle_mobile_new.mp4
hero_scenes/tree_intro_mobile_new.mp4
hero_scenes/tree_canopy_mobile_new.mp4
hero_scenes/oil_drop_mobile_new.mp4

Do not rename these unless technically necessary.

Do not replace them with placeholder assets.

Do not accidentally serve the desktop video to mobile simply by CSS resizing it.

Desktop and mobile are intentionally separate cinematic compositions.

==================================================
MEDIA SELECTION SYSTEM
==================================================

Create a clean responsive media system.

Desktop/tablet landscape should use:

tree_idle_new.mp4
tree_intro_new.mp4
tree_canopy_new.mp4
oil_drop_new.mp4

Mobile portrait should use:

tree_idle_mobile_new.mp4
tree_intro_mobile_new.mp4
tree_canopy_mobile_new.mp4
oil_drop_mobile_new.mp4

Prefer using matchMedia or an equivalent robust responsive media strategy rather than checking window.innerWidth once.

Handle orientation changes and viewport changes gracefully.

Avoid downloading both desktop and mobile video sets unnecessarily.

A mobile visitor should primarily download the mobile assets.

A desktop visitor should primarily download the desktop assets.

==================================================
ACT 1 — IDLE HERO
==================================================

The current homepage hero should be replaced by the new cinematic tree hero.

Use:

desktop:
tree_idle_new.mp4

mobile:
tree_idle_mobile_new.mp4

This scene loops continuously.

It should fill the visual viewport.

Use:
object-fit: cover

but carefully control object-position separately for desktop and mobile so the main tree remains correctly framed.

The existing ZURUNY logo already exists in the project.

Use the REAL existing logo asset.

Do not recreate it with text.
Do not generate a substitute logo.

Place the logo tastefully within the hero composition.

Keep the design restrained.

The hero should feel like an elegant title screen.

When the user is not scrolling, the tree remains alive:
- leaves moving
- birds
- atmospheric movement
- subtle wind

The VIDEO already contains this movement.

Do not add unnecessary fake tree animation over it.

Suggested opening copy should remain very minimal.

Possible direction:

ROOTED IN LEBANON

Extra Virgin Olive Oil shaped by land, time and tradition.

Do not blindly use this exact copy if stronger existing brand copy already exists in the project.

Review the existing content first.

Navigation should overlay the hero.

Navigation styling:
- minimal
- antique ivory/light warm neutral
- transparent background initially
- subtle contrast handling
- no huge header block

==================================================
IDLE → SCROLL TRANSITION
==================================================

This part is extremely important.

tree_idle should NOT simply disappear and tree_intro suddenly appear.

Create a smooth transition.

When the visitor begins meaningful downward scrolling:

tree_idle transitions into tree_intro.

Use:

desktop:
tree_intro_new.mp4

mobile:
tree_intro_mobile_new.mp4

tree_intro is the cinematic push into the olive tree.

The transition should ideally happen through:
- visual matching
- opacity blending over a short controlled range
- matching scale / positioning
- or frame-aware transition if practical

Avoid a visible black frame or flash.

==================================================
SCROLL MODEL
==================================================

The first part of the page should operate as a pinned cinematic viewport.

Do not simply put four videos one below another.

Instead create a cinematic StoryStage component occupying the viewport while scroll position controls scene progression.

The user scrolls through an extended story timeline while the visual stage remains pinned.

Conceptually:

scroll progress
0 → 1

controls the full hero story.

The page itself can provide approximately 600vh–900vh of storytelling distance depending on what feels natural after testing.

There should be NO empty/dead scrolling.

Every scroll movement should produce visible storytelling progression.

==================================================
VIDEO CONTROL
==================================================

tree_idle:
normal looping playback while the hero is idle.

tree_intro:
scroll-driven progression.

tree_canopy:
scroll-driven progression.

oil_drop:
scroll-driven progression.

For scroll-driven video scenes, investigate the most reliable implementation for the current project.

Possible implementation:

video.currentTime =
localSceneProgress * video.duration

but do not blindly implement this if browser seeking becomes visibly poor.

Test actual performance.

If direct video scrubbing performs smoothly, use it.

If not, consider:
- optimized media encoding
- segmented playback
- controlled playback rate
- image sequence only if truly necessary

Do NOT prematurely create thousands of image frames.

Start with the existing videos.

Scrolling backwards should reverse the visual story wherever technically practical.

The experience should not break if a visitor scrolls upward.

==================================================
ACT 2 — ENTER THE TREE
==================================================

Use tree_intro.

As scroll progresses:

the viewer moves closer toward the olive tree and enters its branches.

Story typography can begin appearing in different positions.

Keep it restrained.

Possible narrative beats:

ROOTED IN THE LAND

TIME SHAPES EVERY TREE

A STORY GROWN OVER GENERATIONS

Do not display all of these simultaneously.

One thought at a time.

Typography should move with subtle depth/parallax.

Do not place text inside generic cards.

==================================================
ACT 3 — INSIDE THE CANOPY
==================================================

Use:

desktop:
tree_canopy_new.mp4

mobile:
tree_canopy_mobile_new.mp4

This should feel like continuation of tree_intro.

The camera travels deeper into the olive foliage.

The scene becomes more intimate.

Typography becomes sparse.

Use the foliage as visual depth.

Possible narrative:

FROM FRUIT

or

WHERE THE JOURNEY BECOMES GOLD

Use existing approved brand language if available.

The transition into the next scene should feel deliberate and seamless.

==================================================
ACT 4 — THE OLIVE-OIL DROPLET
==================================================

Use:

desktop:
oil_drop_new.mp4

mobile:
oil_drop_mobile_new.mp4

IMPORTANT:

This video is built around ONE primary elongated olive-oil droplet.

The droplet is NOT simply decorative.

It becomes the central navigation/storytelling device for this entire part of the page.

The website should visually follow the droplet downward.

Keep the droplet clear.

Do not put text directly over it.

Content should appear around it.

DESKTOP

Allow copy to alternate gently between left and right sides of the droplet.

Example visual rhythm:

left story
        droplet

        droplet
                  right story

left story
        droplet

Do not make it mechanical or perfectly alternating.

Use composition from the actual video.

MOBILE

Do not place large paragraphs beside the droplet because horizontal room is limited.

Instead:

use short editorial statements above/below or offset from the central droplet.

Protect the droplet's central visual route.

Do not cover it with navigation, buttons or text.

==================================================
DROPLET STORY CONTENT
==================================================

Use existing ZURUNY factual/product content where available.

Do NOT invent factual claims about:
- harvest method
- acidity
- geography
- cold pressing
- specific varieties
- organic status
- certifications

unless those claims already exist in the project or supplied content.

Potential editorial structure IF supported by existing content:

ORIGIN

North Lebanon

CRAFT

Cold pressed with care

CHARACTER

Rich golden extra virgin olive oil

HERITAGE

From grove to table

Again:
use actual existing ZURUNY information first.

The new design must enhance the existing brand rather than fabricate marketing claims.

==================================================
PARALLAX
==================================================

Content should move independently of the central video.

Use subtle parallax.

Do not exaggerate it.

Different content elements may use slightly different speeds.

Possible layers:

background video
atmospheric graphics
very subtle botanical decorations
story typography
small labels / chapter markers

Parallax should support cinematic depth.

It should never make reading difficult.

==================================================
BOTANICAL ART DIRECTION
==================================================

Inspect existing project assets.

Reuse existing:
- olive illustrations
- brand ornaments
- botanical artwork
- package illustrations
- logo
- icons

where appropriate.

The reference visual language is:

deep oxblood
burgundy
wine red
near-black red
antique ivory
muted olive
faded sage
warm amber/gold

Design should feel like an old botanical book transformed into a contemporary luxury digital experience.

Do NOT randomly add modern abstract graphics.

==================================================
TYPOGRAPHY
==================================================

Inspect the typography already being used by ZURUNY.

Preserve appropriate brand fonts if they already exist.

The visual hierarchy should have:

large elegant display serif
+
quiet highly readable supporting typography.

Use generous spacing.

Avoid massive generic web headings that occupy the entire screen for no reason.

Typography should feel editorial.

Small eyebrow text may use:
uppercase
letter spacing
subtle ivory tone

Body copy should be concise.

CONTRAST GUARDRAIL

Do not place a dark overlay across the entire cinematic frame just to make
text readable. Preserve the original exposure, colour, highlights and detail
of the footage. Prefer repositioning copy, text shadow, or a soft localized
scrim limited to the immediate text area. The contrast treatment must not read
as a card, band or global dark wash.

==================================================
THE DROPLET LANDING
==================================================

The oil_drop video eventually reaches the glass/cup.

As the droplet approaches the destination:

slow the pacing of surrounding text.

Reduce visual noise.

Allow the scene to breathe.

When the droplet lands:

finish the narrative.

Possible line:

FROM OUR TREES
TO YOUR TABLE

Then transition naturally toward the CTA.

==================================================
CTA / PRODUCT ARRIVAL
==================================================

The CTA should feel like the END of the journey.

Do not suddenly switch into a generic ecommerce section.

Allow the final visual composition to settle first.

Then progressively reveal:

ZURUNY product
product identity
short statement
primary CTA

Potential CTA:

DISCOVER ZURUNY

or use the existing shop/product CTA already established in the current website.

Secondary CTA may link to:
Our Story
or another existing meaningful route.

If product assets already exist in the project, use them.

Do not create placeholder packaging.

==================================================
AFTER THE CINEMATIC HERO
==================================================

This redesign applies to the full landing page, not only the video stage.

Once the cinematic sequence completes, redesign the remaining homepage sections to visually belong to the same world.

Inspect what content currently exists.

Preserve useful content but restructure it.

Potential post-story structure:

product / collection
brand story
origin
craft
editorial photography
product details
testimonials if currently real
newsletter/footer

Do NOT blindly create sections that the current site does not need.

The transition from cinematic storytelling into normal browsing should feel natural.

The lower page may become slightly more conventional for usability, but maintain:
- oxblood / ivory palette
- botanical details
- generous editorial layout
- premium imagery
- sophisticated typography

==================================================
NAVIGATION
==================================================

Retain useful existing navigation/routes.

Redesign presentation only.

Desktop:
refined horizontal navigation.

Mobile:
clean menu trigger.

Do not overcrowd the hero.

Navigation must remain usable throughout the cinematic section.

Change contrast or background subtly where needed.

==================================================
MOBILE IS A FIRST-CLASS EXPERIENCE
==================================================

Mobile must NOT be an afterthought.

There are dedicated mobile videos specifically because the compositions are different.

Use them.

Test:

320px
360px
375px
390px
412px
430px

and common tablet widths.

Important mobile requirements:

- use dedicated 9:16 videos
- keep tree framing intentional
- keep droplet unobstructed
- avoid oversized text
- ensure CTAs are thumb-friendly
- reduce unnecessary parallax
- reduce memory usage
- do not load desktop media
- account for dynamic browser address bars
- prefer dvh/svh where appropriate rather than blindly using 100vh
- account for safe areas
- keep navigation readable
- avoid horizontal overflow

==================================================
PERFORMANCE
==================================================

This experience is media-heavy.

Performance engineering is mandatory.

Implement:

- responsive video source selection
- preload only what is immediately needed
- preload the next cinematic scene shortly before activation
- lazy load later content
- pause inactive videos
- release unnecessary decoding work when possible
- playsInline
- muted
- appropriate preload settings
- avoid simultaneous playback of hidden videos
- prevent unnecessary React rerenders during scrolling
- requestAnimationFrame-based animation where appropriate
- GPU-friendly transforms
- avoid layout thrashing

Do NOT preload every video at page initialization.

Initial load priority:

1. mobile OR desktop idle video depending on viewport
2. logo / above-fold essentials

Then quietly load:

tree_intro

Then:
tree_canopy

Then:
oil_drop

Use progressive media preparation.

==================================================
LOADING EXPERIENCE
==================================================

Because the hero depends on video, create an intentional startup state.

Use the real ZURUNY logo.

Deep burgundy background.

Small elegant loading/progress treatment.

No generic spinner.

Potential microcopy:

PREPARING THE GROVE

Only use this if it fits the brand.

As soon as the first hero scene can play smoothly, reveal the site.

Do not force users to wait for every video.

==================================================
MEDIA FAILURE FALLBACK
==================================================

If video cannot autoplay or fails to load:

show an appropriate poster/static visual.

The page must still remain usable.

Do not leave a black screen.

==================================================
REDUCED MOTION
==================================================

Respect:

prefers-reduced-motion

For those users:

do not force extensive scroll-controlled video motion.

Provide a simpler presentation using:
- poster frames
- fades
- static storytelling sections
- readable content

All meaningful text must remain HTML.

Do not bake website copy into videos.

==================================================
AUDIO
==================================================

Do not autoplay audible sound.

If existing design calls for ambient audio later, architect an optional explicit user-controlled sound toggle.

But audio is NOT required for this implementation.

==================================================
ACCESSIBILITY
==================================================

Maintain semantic HTML.

Keyboard navigation must work.

Visible focus states.

Sufficient text contrast.

Buttons and links must remain real interactive elements.

Do not make accessibility dependent on animation.

Videos used decoratively should not create useless screen-reader noise.

==================================================
TECHNICAL ARCHITECTURE
==================================================

Adapt to the project's EXISTING framework.

Do not migrate frameworks unnecessarily.

If this is React/Next.js, consider a structure similar to:

components/
  cinematic/
    CinematicJourney
    StoryStage
    ResponsiveSceneVideo
    ScrollVideo
    StoryCopy
    SceneTransition
    LoadingExperience

data/
  homepageStory.ts

But adapt this to the actual codebase.

Do NOT blindly create this structure if the project already has an appropriate architecture.

Centralize scene configuration.

Example conceptual data:

idle
intro
canopy
oilDrop

Each scene may define:

desktopSrc
mobileSrc
scrollStart
scrollEnd
copy
transition
mediaBehavior

Do not scatter video filenames across dozens of components.

==================================================
ANIMATION LIBRARY
==================================================

Inspect current dependencies first.

If GSAP + ScrollTrigger already exists, use it.

If not, evaluate whether adding GSAP is justified.

For this type of cinematic pinned scroll experience, GSAP ScrollTrigger is acceptable and likely appropriate.

Do not add multiple overlapping animation libraries.

Use one coherent animation system.

If Lenis already exists, integrate carefully.

Do not create double-smoothing.

==================================================
SCROLL BEHAVIOR
==================================================

Do not hijack the user's mouse wheel.

Users should retain natural control.

The experience may use sticky/pinned sections but scrolling should remain intuitive.

Avoid aggressive snap points.

Avoid trapping the user.

==================================================
DEVELOPMENT DEBUG MODE
==================================================

Create a developer-only cinematic debug panel available through something like:

?debug=true

Show:

viewport mode:
desktop/mobile

active scene

global story progress

local scene progress

video duration

video currentTime

video readyState

loaded status

FPS if practical

This will make tuning significantly easier.

Do not show debug UI normally.

==================================================
IMPLEMENTATION ORDER
==================================================

Do the work in this order:

PHASE 1
Audit existing project.

PHASE 2
Document the current homepage architecture and what will be retained/replaced.

PHASE 3
Implement responsive video selection.

PHASE 4
Replace existing hero with idle cinematic tree.

PHASE 5
Build pinned storytelling timeline.

PHASE 6
Connect tree_intro.

PHASE 7
Connect tree_canopy.

PHASE 8
Connect oil_drop.

PHASE 9
Build surrounding parallax typography/story.

PHASE 10
Build droplet landing → CTA.

PHASE 11
Redesign remaining homepage sections to match.

PHASE 12
Mobile polish.

PHASE 13
Performance optimization.

PHASE 14
Accessibility and reduced-motion fallback.

PHASE 15
Cross-browser testing and final refinement.

==================================================
IMPORTANT WORKING RULES
==================================================

Do not stop after changing the hero.

This is a FULL homepage redesign.

However:

do not unnecessarily rewrite stable backend functionality.

do not break existing routes.

do not remove ecommerce functionality.

do not replace real content with placeholders.

do not delete useful brand assets.

do not invent product facts.

do not introduce unnecessary dependencies.

do not rewrite working architecture simply because another architecture is fashionable.

Work incrementally.

After every meaningful phase:

run:
- type checking
- lint
- tests if available
- production build

Fix regressions immediately.

==================================================
FIRST ACTION
==================================================

Before changing code:

inspect the project thoroughly.

Report briefly:

1. framework and major dependencies
2. current homepage structure
3. current hero implementation
4. relevant existing assets
5. existing brand fonts/colors
6. current animation system
7. proposed files/components to modify
8. anything that could conflict with the cinematic implementation

Then begin implementation.

Do not wait for approval unless you find a genuinely destructive architectural conflict.

The objective is to actually implement the redesign, not only produce recommendations.
