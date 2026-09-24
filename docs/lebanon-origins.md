# Shop origins relief

Implements `prompt.md` above the existing ShopGrid catalogue. The HTML list and
origin details remain usable if WebGL or a GLB fails. UI copy supports EN/FR.

## Assets and geographic contract

The supplied files actually live at `public/maps/lebanon_terrain_desktop.glb`
and `public/maps/lebanon_terrain_mobile.glb`. They are used unchanged.
Only the selected variant is fetched; portrait or widths below 768px use mobile.
The scene bundle and model are deferred until within 240px of the map viewport.

`src/data/lebanon-origins.ts` owns the five geographic positions and product
handles. `terrain.ts` owns model paths, raster extent, and global `flipX/flipY`.
No latitude/longitude approximation or per-marker correction is applied.

The actual exports have a local X/Z plane and Y elevation: east is +X and north
is -Z (Blender's exported axis conversion). Both flips are false. The terrain is
identified by `terrain_material*`, independently of the transformed ivory slab.
Its geometry bounds define the mapping. Rays follow the transformed elevation
axis through `matrixWorld`; misses fail explicitly instead of inventing heights.
Douma is north of Deir Mimas; Rashaya is east of Aabra in both models.

Georges and Fayez retain their molasses product types. Their action reads
“View product”; olive oils use “View oil.” Live product descriptions, photographs,
and available specifications supply the panel. Najibe remains selectable as an
origin, without a product link while absent from the live catalogue. Selecting
an origin never changes cart state or makes an unlisted product purchasable.

## Interaction and performance

Camera tilt and azimuth are bounded; zoom uses three limited button steps.
The zoom level is preserved during selection. Dragging interrupts fly-to.
The semantic HTML list is the keyboard and screen-reader control surface;
the duplicate visual map targets are hidden from assistive technology.

Rendering uses demand mode, capped DPR (1.25 mobile / 1.75 desktop), two lights
on mobile, no mobile shadows, and a 512px desktop shadow map. Small idle drift
stops offscreen and in hidden tabs. Reduced motion disables drift, camera fly-to,
damping, panel fades, and marker pulses. Ordinary vertical touch scrolling is
preserved; horizontal dragging explores the relief.

In development, open `/en/shop?debug=true` for model, rendered FPS, selected
origin, orientation, mesh-local marker coordinates/bounds, camera and target.
Demand-mode FPS counts rendered frames, not the display's refresh rate.

## Verification

- `npm test`: raycasts all five positions on both real GLBs, verifies geographic
  ordering, global flips, invalid input, and non-uniform parent transforms.
- `npm run lint` and `npm run build`.
- Start `npm run dev`, then `npm run test:origins:browser`. `CHROME_PATH` overrides
  the Windows Chrome default; `TEST_BASE_URL` overrides localhost:3000. This suite
  needs the development debug panel for camera checks. Screenshots and results
  go to `.tmp/origins/`.
- Browser coverage: 320/360/375/390/412/430/768/1024/1440px, marker/keyboard
  selection, filtered and repeated catalogue jumps, zoom/reset, offscreen pause,
  French, reduced motion, and failed GLB fallback.

The production build was also checked for deferred model loading, one request
per variant across resizes, cache reuse, disabled debug UI, and existing routes.
Chrome checks use software WebGL; physical-device GPU performance still depends
on the device.

Implementation references: [R3F demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance),
[Drei controls](https://drei.docs.pmnd.rs/controls/introduction),
[Three.js raycasting](https://threejs.org/docs/pages/Raycaster.html), and the
installed Next.js `dist/docs/01-app/02-guides/lazy-loading.md`.
