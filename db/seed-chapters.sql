-- One-time: moves the 5 hardcoded book chapters (formerly
-- src/data/namesJournal.ts's chapterRegistry/chapterAssets) into the
-- database, reusing the image files already on disk under public/names/ —
-- no re-upload needed. Idempotent: safe to run more than once.
--
--   psql "$DATABASE_URL" -f db/seed-chapters.sql

insert into zuruny_chapters (product_id, slug, allow_draft, position)
select id, v.slug, v.allow_draft, v.position
from zuruny_products, (values
  ('georges-br-carob-molasses', 'georges',  false, 1),
  ('fayez-for-caroub-molasse',  'fayez',     false, 2),
  ('malvina',                   'malvina',   false, 3),
  ('em-ramiz',                  'em-ramiz',  false, 4),
  ('najibe',                    'najibe',    true,  5)
) as v(handle, slug, allow_draft, position)
where zuruny_products.handle = v.handle
on conflict (product_id) do nothing;

insert into zuruny_chapter_images (chapter_id, kind, src, width, height, alt, position)
select c.id, v.kind, v.src, v.width, v.height, v.alt, v.position
from zuruny_chapters c, (values
  ('georges',  'dedication', '/names/georges/GEORGES.webp', 1024, 1536, 'Georges dedication artwork', 0),
  ('georges',  'product',    '/names/georges/ChatGPT Image 15 sept. 2026 aĚ 14_11_39.webp', 1214, 1295, 'Georges carob molasses jar on burgundy', 0),
  ('georges',  'place',      '/names/georges/32c78a6de85250d3f40e723703ea3571.webp', 736, 918, 'Olive branches above a dry stone wall', 0),
  ('georges',  'detail',     '/names/georges/ChatGPT Image Sep 5, 2026 at 11_17_34 PM.webp', 1536, 1024, 'Fruit and ceramics in a stone window', 0),

  ('fayez',    'dedication', '/names/fayez/fayez.webp', 1024, 1536, 'Fayez dedication artwork', 0),
  ('fayez',    'product',    '/names/fayez/ChatGPT Image 15 sept. 2026 à 14_13_42.webp', 1215, 1295, 'Fayez grape molasses jar on burgundy', 0),

  ('malvina',  'dedication', '/names/malvina/MAL texte.webp', 1024, 1536, 'Malvina dedication artwork', 0),
  ('malvina',  'product',    '/names/malvina/e917d200-0f39-4a88-825b-0d5fee820b08.webp', 1086, 1448, 'Malvina olive oil tins on black', 0),
  ('malvina',  'portrait',   '/names/malvina/6bbc5b43-fe66-4742-b166-40d74124dfbd.webp', 1023, 1537, 'Malvina tin beside a family photograph and olive branch', 0),
  ('malvina',  'detail',     '/names/malvina/7b47904a-af4e-4f47-a0b6-f3e4e20f4fde.webp', 1023, 1537, 'Malvina tin with a family photograph and carafe', 0),

  ('em-ramiz', 'dedication', '/names/em-ramiz/em ramiz.webp', 1024, 1536, 'Em Ramiz dedication artwork, in honor of Alice', 0),

  ('najibe',   'dedication', '/names/najibe/najibe.webp', 1024, 1536, 'Najibe dedication artwork', 0),
  ('najibe',   'product',    '/names/najibe/najibe 2.webp', 1537, 1023, 'A single Najibe olive oil tin on black', 0),
  ('najibe',   'place',      '/names/najibe/55999dca-9b48-48ef-b01d-9eca2c16e12b copy.webp', 1448, 1086, 'A figure among olive trees in golden light', 0),
  ('najibe',   'portrait',   '/names/najibe/NAJIBE 1.webp', 1054, 1492, 'Najibe portrait in a Lebanese postage stamp design', 0)
) as v(slug, kind, src, width, height, alt, position)
where c.slug = v.slug
  and not exists (
    select 1 from zuruny_chapter_images i where i.chapter_id = c.id and i.kind = v.kind and i.src = v.src
  );
