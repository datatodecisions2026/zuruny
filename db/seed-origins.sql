-- One-time: moves the 5 hardcoded map pins (formerly
-- src/data/lebanon-origins.ts) into the database. Idempotent.
--
--   psql "$DATABASE_URL" -f db/seed-origins.sql

insert into zuruny_origins
  (slug, name, region, lat, lng, map_x, map_y, product_id, product_label, image, note, position)
select v.slug, v.name, v.region, v.lat, v.lng, v.map_x, v.map_y,
       p.id, v.product_label, v.image, v.note, v.position
from (values
  ('ain-el-rihaneh', 'Ain el-Rihaneh', 'Keserwan-Jbeil, Mount Lebanon', 33.95966, 35.64732, 0.352296, 0.546742,
   'georges-br-carob-molasses', 'Georges', '/names/georges/GEORGES.webp',
   'The origin associated with Georges, in Ain el-Rihaneh, Mount Lebanon.', 1),
  ('rashaya', 'Rashaya', 'Beqaa Governorate', 33.50142, 35.84488, 0.485788, 0.285160,
   'fayez-for-caroub-molasse', 'Fayez', '/names/fayez/fayez.webp',
   'Rashaya al-Wadi, a historic mountain town in Lebanon''s Beqaa Governorate.', 2),
  ('deir-mimas', 'Deir Mimas', 'South Lebanon', 33.30194, 35.54528, 0.300461, 0.166440,
   'malvina', 'Malvina', '/names/malvina/6bbc5b43-fe66-4742-b166-40d74124dfbd.webp',
   'The South Lebanon origin associated with Malvina.', 3),
  ('aabra', 'Aabra', 'South Governorate', 33.56667, 35.40583, 0.207679, 0.317398,
   'em-ramiz', 'Em Ramiz', '/names/em-ramiz/em-ramiz.webp',
   'Aabra lies immediately east of Sidon, on hills overlooking the Mediterranean coast.', 4),
  ('douma', 'Douma', 'Batroun District, North Lebanon', 34.20457, 35.84073, 0.468533, 0.690399,
   'najibe', 'Najibe', '/names/najibe/najibe.webp',
   'The North Lebanon origin associated with Najibe.', 5)
) as v(slug, name, region, lat, lng, map_x, map_y, product_handle, product_label, image, note, position)
left join zuruny_products p on p.handle = v.product_handle
on conflict (slug) do nothing;
