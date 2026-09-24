You are working inside the existing ZURUNY website.

The Shop page already exists.

I have created two optimized GLB terrain models of Lebanon:

public/maps/lebanon/lebanon-terrain-desktop.glb
public/maps/lebanon/lebanon-terrain-mobile.glb

Desktop model:
~81k triangles
~3.1 MB

Mobile model:
~30k triangles
~2.0 MB

The terrain is a real Lebanon relief model with a separate ivory slab/base and terrain material.

GOAL

Build an interactive 3D Lebanon origins section at the top of the Shop page, before the existing product catalogue.

This section should feel like a premium interactive physical relief map, not a generic GIS viewer.

Use:
- Three.js
- React Three Fiber
- Drei
- GSAP only if needed for camera animation

Inspect the current project before implementation and reuse the existing framework and styling system.

DO NOT:
- replace the existing shop
- rebuild the project
- break existing routes
- use a generic map library instead of the GLB terrain
- add unnecessary post-processing
- create a globe
- create free unrestricted orbiting


==================================================
EXACT TERRAIN GEOREFERENCING
==================================================

The Lebanon terrain originates from a raster in:

EPSG:32636
WGS 1984 UTM Zone 36N

Original terrain raster extent:

Left / XMin:
692729.556524

Right / XMax:
840029.556524

Bottom / YMin:
3655620.861511

Top / YMax:
3848070.861511

The Blender terrain was generated from this exact raster.

Approximate Blender dimensions before export:

X = 7.56
Y = 10.10
Z = 0.556

Do NOT depend on these Blender dimensions as hardcoded runtime bounds.

The exported GLB may retain object transforms.

At runtime, derive the terrain mesh's actual local geometry bounding box and use normalized map coordinates against those bounds.

The origin dataset already includes geographic lat/lng plus normalized mapX/mapY positions derived from the source raster.

Normalized coordinates:

Georges / Ain el-Rihaneh:
mapX = 0.352296
mapY = 0.546742

Fayez / Rashaya:
mapX = 0.485788
mapY = 0.285160

Malvina / Deir Mimas:
mapX = 0.300461
mapY = 0.166440

Em Ramiz / Aabra:
mapX = 0.207679
mapY = 0.317398

Najibe / Douma:
mapX = 0.468533
mapY = 0.690399

These values are normalized from the real EPSG:32636 raster extent.

Implementation:

1. identify the actual terrain top mesh in the GLB
2. compute its local geometry bounding box
3. map mapX/mapY into local terrain X/Y
4. raycast from above along the terrain elevation axis
5. use the hit position as the marker position
6. offset marker slightly above the surface to avoid z-fighting
7. transform correctly through the terrain object's matrixWorld

Do NOT hand-position individual markers.

Do NOT visually guess marker coordinates.

Provide a central configurable orientation transform:

flipX = false
flipY = false

If the imported GLB orientation requires axis reversal, use:

u = flipX ? 1 - mapX : mapX
v = flipY ? 1 - mapY : mapY

Verify orientation using:

Douma = northern Lebanon
Deir Mimas = far southern Lebanon

If those appear reversed vertically, toggle flipY globally.

Also verify Rashaya is toward eastern Lebanon and Aabra is near the southwest coast/Sidon area.

Include the orientation configuration in debug mode.


==================================================
RESPONSIVE MODEL LOADING
==================================================

Use:

Desktop / larger landscape:
lebanon-terrain-desktop.glb

Mobile / portrait:
lebanon-terrain-mobile.glb

Do not load both models unnecessarily.

Use a robust media-query based solution.

Mobile should prioritize:
- lower device pixel ratio
- lower shadow cost
- less camera motion
- tap interaction

==================================================
SCENE DESIGN
==================================================

Create a dark ZURUNY environment.

Background:
deep burgundy / near-black red

Model:
centered as a floating physical terrain artifact

Lighting:
- warm directional key light
- very soft fill light
- restrained shadow
- no bright studio-white environment

The ivory slab should remain visible.

The terrain should feel dimensional and tactile.

Do not make the scene glossy.

==================================================
CAMERA
==================================================

Initial camera should show the full country at a tasteful oblique angle.

Do not allow unrestricted free orbit.

Allow only:
- small horizontal rotation
- small vertical tilt
- limited zoom
- gentle drag interaction

Use OrbitControls with strict constraints if appropriate.

No full 360 degree spinning.

No upside-down viewing.

No extreme zoom.

The model should behave like an exhibited object.

==================================================
IDLE MOTION
==================================================

When the user is not interacting:

add only a very subtle slow camera drift or terrain rotation.

Maximum a few degrees.

No endless spinning.

==================================================
GEOGRAPHIC MARKERS
==================================================

Build a reusable origin marker system.

Marker data must use real:
- latitude
- longitude
- product name
- village/location
- region
- image
- product target

Store data centrally.

Do not hardcode marker transforms manually in components.

Create a geographic-to-model coordinate mapping system.

The terrain was created from a projected Lebanon raster in WGS 84 / UTM Zone 36N.

Use the known raster/terrain extent and map coordinates into the model's local X/Z coordinate space.

If exact terrain elevation is required at marker position:
raycast downward onto the mesh and set marker Y to the hit point.

Markers must sit on the terrain, not float at random heights.

==================================================
MARKER DESIGN
==================================================

Use elegant minimal ZURUNY markers.

Suggested style:
- small ivory circular point
- burgundy center
- thin vertical stem
- subtle selected-state pulse

Avoid:
- Google Maps pins
- neon glow
- bouncing markers
- oversized labels

On desktop:
show name on hover.

On mobile:
tap to select.

==================================================
SELECTED LOCATION INTERACTION
==================================================

When the user selects a marker:

1. select that origin
2. fade other markers slightly
3. smoothly move/rotate camera toward the region
4. keep the terrain visible
5. reveal an HTML information panel

The transition should feel elegant and controlled.

Use GSAP or a requestAnimationFrame interpolation for the camera if needed.

Do not teleport the camera.

==================================================
HTML INFORMATION PANEL
==================================================

Use normal HTML/CSS for all text and UI.

Do not render long text inside Three.js.

Desktop:
use a refined side panel aligned with the scene.

Mobile:
use a bottom sheet below/over the lower portion of the map.

Panel may include:

- location name
- region
- product name
- olive variety
- harvest period
- altitude
- product image
- short origin note
- VIEW OIL button

Only use facts already present in the project.

Do not invent product claims.

==================================================
CATALOGUE CONNECTION
==================================================

The VIEW OIL action should connect the map to the existing shop catalogue.

Prefer:

click VIEW OIL
→ smooth scroll to the corresponding product card/section

If the product already has a dedicated route, preserve that route as the secondary action.

The map should help users understand origin before browsing products.

==================================================
MOBILE
==================================================

Mobile must use the dedicated mobile GLB.

Do not simply shrink desktop.

Use:
- lower DPR
- simpler lighting
- no expensive shadows if performance drops
- tighter interaction bounds
- larger tap targets
- bottom-sheet origin details
- less idle motion

Test:
320
360
375
390
412
430

==================================================
PERFORMANCE
==================================================

Lazy-load the entire 3D section.

Do not make Three.js block initial page load.

Load only when the Shop map section is near the viewport.

Use:
- Suspense/loading fallback
- frameloop="demand" where practical
- capped DPR
- minimal lights
- no unnecessary post-processing
- compressed GLB as-is
- no duplicate terrain loads

Pause unnecessary animation when the section is out of view.

==================================================
ACCESSIBILITY
==================================================

Every origin must also be accessible outside WebGL.

Provide a semantic HTML origin list for keyboard/screen-reader access.

Markers must not be the only way to access information.

Respect prefers-reduced-motion.

Reduced-motion mode:
- no camera fly-to
- simpler map interaction
- panel updates instantly

==================================================
DEBUG MODE
==================================================

Add optional ?debug=true support showing:

- active model: desktop/mobile
- FPS
- selected origin
- marker local coordinates
- camera position
- target
- model bounds

This is for development only.

==================================================
IMPLEMENTATION ORDER
==================================================

1. inspect the existing Shop page
2. install only missing dependencies
3. load desktop/mobile GLB
4. render full terrain cleanly
5. constrain camera interaction
6. add responsive model switching
7. create marker data structure
8. implement coordinate mapping
9. raycast markers onto terrain
10. add marker interaction
11. build HTML info panel
12. connect VIEW OIL to catalogue
13. mobile bottom-sheet layout
14. reduced-motion support
15. performance tuning
16. production build and regression checks

Do not stop at a static 3D render.

Implement the interactive experience.