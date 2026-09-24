# About page films

The English and French About pages pair the existing story with a pottery background and a portrait company film. Copy lives in `src/components/about/copy.ts`; styling stays local to these pages.

- The company film has no `src` until Play is pressed, with `preload="none"`. Native streaming lets playback start before the whole file downloads and preserves seeking, sound, fullscreen, and inline mobile controls.
- The loading message shows the supplied film size (9.6 MB, approximately 9.6 MiB on disk), not a simulated download percentage. It appears during startup and buffering. Failed requests have a retry action.
- The pottery film plays muted only while visible and the tab is active. Reduced motion, Save-Data, and known slow connections use the poster without fetching the video. Visitors can explicitly start or pause the background.
- Both WebP posters were extracted from the supplied films with FFmpeg; together they weigh about 49 KB. The original MP4s are unchanged. Update the duration, file-size labels, and posters if replacing the films.
- The company film is displayed at its original portrait ratio without cropping. The supplied film includes visible text; no separate caption track or transcript was supplied.

Verify with `node tests/about.browser.mjs` against a local server (`TEST_BASE_URL` overrides port 3000; `CHROME_PATH` overrides the Chrome executable). It checks request gating, delayed loading, keyboard playback, responsive layouts, French labels, background controls, reduced motion, Save-Data, and failed-download recovery. Screenshots are written under `.tmp/about/`.
