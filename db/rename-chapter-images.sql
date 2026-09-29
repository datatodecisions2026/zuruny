-- One-time: repoints rows already written by an earlier run of
-- seed-origins.sql / seed-chapters.sql at the renamed files in public/names/.
--
-- Why: Next's image optimizer returns 400 ("the requested resource isn't a
-- valid image ... received null") for a handful of the original filenames —
-- long ones with spaces, a comma, or an accented character. The plain-named
-- files it works fine for prove the file itself was never the problem.
-- Renaming to plain ASCII sidesteps whatever Next is tripping on, rather
-- than chasing the exact cause inside its image optimizer.
--
-- Only run this if you already ran the seed files before this fix landed —
-- a first-time seed on a fresh database already gets the new names and
-- doesn't need this. Matches by chapter + kind, not by the old filename, so
-- there's no risk of a byte-encoding mismatch on the accented one.
--
--   psql "$DATABASE_URL" -f db/rename-chapter-images.sql

update zuruny_chapter_images i set src = '/names/em-ramiz/em-ramiz.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'em-ramiz' and i.kind = 'dedication';

update zuruny_chapter_images i set src = '/names/fayez/fayez-product.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'fayez' and i.kind = 'product';

update zuruny_chapter_images i set src = '/names/georges/georges-product.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'georges' and i.kind = 'product';

update zuruny_chapter_images i set src = '/names/georges/georges-detail.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'georges' and i.kind = 'detail';

update zuruny_chapter_images i set src = '/names/malvina/malvina-dedication.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'malvina' and i.kind = 'dedication';

update zuruny_chapter_images i set src = '/names/najibe/najibe-product.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'najibe' and i.kind = 'product';

update zuruny_chapter_images i set src = '/names/najibe/najibe-place.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'najibe' and i.kind = 'place';

update zuruny_chapter_images i set src = '/names/najibe/najibe-portrait.webp'
  from zuruny_chapters c where c.id = i.chapter_id and c.slug = 'najibe' and i.kind = 'portrait';

update zuruny_origins set image = '/names/em-ramiz/em-ramiz.webp'
  where slug = 'aabra' and image like '/names/em-ramiz/%';
