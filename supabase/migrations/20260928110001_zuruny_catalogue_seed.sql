-- Catalogue seed, generated from src/lib/catalog.ts.
-- Regenerate with: node scripts/render-catalogue-seed.mjs
-- Safe to run again: products that already exist are left untouched,
-- including any price or stock an admin has changed.

with incoming as (
  select *
  from jsonb_to_recordset($zuruny_catalogue$[{"handle":"malvina","name":"Malvina","kind":"olive-oil","status":"active","named_after_from":"Achrafieh","description":"In South Lebanon, Deir Mimas unfolds among rolling hills lined with olive trees, some of which have stood for centuries. From the Hasbani family.","description_fr":"Au Liban-Sud, Deir Mimas se déploie parmi des collines plantées d'oliviers, dont certains sont centenaires. De la famille Hasbani.","memory":"I chose to honor my grandfather's mother because although I never had the chance to know him, I wanted to pay tribute to him. And what better way than celebrating the woman who gave him life? Whenever I ask about her, her presence still resonates through the memories of my father and my teta. She had the kind of energy you simply don't forget, someone who is still very much alive in the memories of those who loved her, and whose legacy somehow lives on in me.","pull_quote":"She had the kind of energy you simply don't forget.","position":0,"variants":[{"label":"250 ml","price_cents":2800,"stock":12,"available":true,"position":0},{"label":"1 L","price_cents":null,"stock":0,"available":false,"position":1},{"label":"3 L","price_cents":null,"stock":0,"available":false,"position":2}],"images":[{"src":"/products/malvina-2.png","width":1086,"height":1448,"alt":"Malvina olive oil tins grouped on a black ground","position":0},{"src":"/products/malvina-1.png","width":1023,"height":1538,"alt":"A Malvina tin styled with a tantour carafe and a vintage family photograph","position":1}],"spec":[{"label":"Village","value":"Deir Mimas, South Lebanon","label_fr":"Village","value_fr":"Deir Mimas, Liban-Sud","position":0},{"label":"Family","value":"Hasbani","label_fr":"Famille","value_fr":"Hasbani","position":1},{"label":"Harvest","value":"Late September – October","label_fr":"Récolte","value_fr":"Fin septembre – octobre","position":2},{"label":"Altitude","value":"400–500 m","label_fr":"Altitude","value_fr":"400–500 m","position":3},{"label":"Variety","value":"Baladi","label_fr":"Variété","value_fr":"Baladi","position":4},{"label":"Acidity","value":"< 0.5%","label_fr":"Acidité","value_fr":"< 0,5 %","position":5},{"label":"Best use","value":"Kitchen & Table Olive Oil (CAT 2)","label_fr":"Meilleur usage","value_fr":"Huile de cuisine et de table (CAT 2)","position":6}]},{"handle":"em-ramiz","name":"Em Ramiz","kind":"olive-oil","status":"active","named_after_from":"Machghara","description":"Overlooking the ancient Phoenician city of Sidon, Aabra sits between the Mediterranean and the hills of Mount Lebanon. From the Mushantaf family, who have cultivated olive trees for two generations.","description_fr":"Dominant l'antique cité phénicienne de Sidon, Aabra s'étend entre la Méditerranée et les collines du Mont-Liban. De la famille Mushantaf, qui cultive l'olivier depuis deux générations.","memory":"I decided to honor my grandmother's lineage because she looks so much like her mother. Since we were children, we have always visited them, or they have visited us. Their mother's name was Alice. Amale is my teta. Ramiz would always come to play cards with us and bring us chocolate. Sophie is the one who is always there to help everyone — you have a new baby? She is already on a plane. Afaf, the youngest, is always laughing, and oh God, I love her macaroni dish. Since the creation of Skype they have spoken every single day, at the same hour, one calling the other. My teta always knows who is calling without even looking at her screen.","pull_quote":"My teta always knows who is calling without even looking at her screen.","position":1,"variants":[{"label":"250 ml","price_cents":1000,"stock":0,"available":false,"position":0},{"label":"1 L","price_cents":null,"stock":0,"available":false,"position":1},{"label":"3 L","price_cents":null,"stock":0,"available":false,"position":2}],"images":[{"src":"/products/em-ramiz-1.png","width":1402,"height":1122,"alt":"Three Em Ramiz tins on a deep red ground","position":0}],"spec":[{"label":"Village","value":"Aabra, Chouf","label_fr":"Village","value_fr":"Aabra, Chouf","position":0},{"label":"Family","value":"Mushantaf, 2nd generation","label_fr":"Famille","value_fr":"Mushantaf, 2e génération","position":1},{"label":"Harvest","value":"Early — September 2025","label_fr":"Récolte","value_fr":"Précoce — septembre 2025","position":2},{"label":"Altitude","value":"150 m","label_fr":"Altitude","value_fr":"150 m","position":3},{"label":"Variety","value":"Frontoio","label_fr":"Variété","value_fr":"Frantoio","position":4},{"label":"Acidity","value":"< 0.5%","label_fr":"Acidité","value_fr":"< 0,5 %","position":5},{"label":"Best use","value":"Table & Finishing Olive Oil","label_fr":"Meilleur usage","value_fr":"Huile de table et de finition","position":6}]},{"handle":"georges-br-carob-molasses","name":"Georges","kind":"carob-molasses","status":"active","named_after_from":"Ebel el Saqi","description":"Crafted from carefully selected carob pods, our Carob Molasses is a traditional Mediterranean syrup with a rich, naturally sweet flavor and a smooth texture. Made without added sugar, preservatives, or artificial ingredients.","description_fr":"Élaborée à partir de caroubes soigneusement sélectionnées, notre mélasse de caroube est un sirop méditerranéen traditionnel, naturellement sucré, à la texture onctueuse. Sans sucre ajouté, sans conservateurs, sans ingrédients artificiels.","memory":"I never had the chance to know him, yet he has always been a part of my life. When I was younger, every summer we would visit his grave and pray. It’s strange to pray and speak to someone you never knew — you have never heard the sound of his voice, his laugh, or even known his smell. Yet somehow we know him through the endless stories my grandmother tells, through the pictures I would find during family visits. \"Here’s your jeddo.\" He is mine without ever truly being mine. Whenever I am asked, \"If you could interview one person, dead or alive, who would it be?\", my answer is always the same: him.","pull_quote":"He is mine without ever truly being mine.","position":2,"variants":[{"label":null,"price_cents":1500,"stock":0,"available":false,"position":0}],"images":[],"spec":[{"label":"Village","value":"Rihane","label_fr":"Village","value_fr":"Rihane","position":0},{"label":"Made from","value":"Carob pods","label_fr":"Élaborée à partir de","value_fr":"Caroubes","position":1},{"label":"Added sugar","value":"None","label_fr":"Sucre ajouté","value_fr":"Aucun","position":2},{"label":"Preservatives","value":"None","label_fr":"Conservateurs","value_fr":"Aucun","position":3},{"label":"Diet","value":"Vegan, gluten-free","label_fr":"Régime","value_fr":"Vegan, sans gluten","position":4},{"label":"Storage","value":"Cool, dry place away from sunlight — no refrigeration needed","label_fr":"Conservation","value_fr":"Lieu frais et sec, à l'abri de la lumière — pas de réfrigération nécessaire","position":5},{"label":"How to taste it","value":"Yogurt, labneh, or tahini · Bread or toast · Beverages & smoothies · Cooking with chicken & baking","label_fr":"Comment la déguster","value_fr":"Sur yaourt, labné ou tahiné · Sur pain ou toast · Dans les boissons & smoothies · En cuisine avec le poulet & la pâtisserie","position":6}]},{"handle":"fayez-for-caroub-molasse","name":"Fayez","kind":"grape-molasses","status":"active","named_after_from":"Mehmarch","description":"Made from carefully selected grapes, crafted using traditional methods to preserve its rich flavor and natural sweetness.","description_fr":"Élaborée à partir de raisins soigneusement sélectionnés, selon des méthodes traditionnelles qui préservent sa richesse et sa douceur naturelle.","memory":"I had the chance to know him, but not enough, and that has always been my greatest regret. In the videos we were always together, always happy, and he was always so proud of me. He never failed to make me smile, especially when he would put 2 kg of walnuts picked directly from the tree into my suitcase because he knew how much I loved them. I will never forget the day I found a huge sunflower and brought it to him. He looked at me, told me the name of the flower and called me \"the chamess.\" Since that day, the sunflower has been my favourite flower.","pull_quote":"He called me “the chamess.” Since that day, the sunflower has been my favourite flower.","position":3,"variants":[{"label":null,"price_cents":1000,"stock":10,"available":true,"position":0}],"images":[],"spec":[{"label":"Village","value":"Rachaya","label_fr":"Village","value_fr":"Rachaya","position":0},{"label":"Made from","value":"Grapes","label_fr":"Élaborée à partir de","value_fr":"Raisins","position":1},{"label":"Method","value":"Traditional reduction","label_fr":"Méthode","value_fr":"Réduction traditionnelle","position":2},{"label":"Added sugar","value":"None","label_fr":"Sucre ajouté","value_fr":"Aucun","position":3},{"label":"Preservatives","value":"None","label_fr":"Conservateurs","value_fr":"Aucun","position":4},{"label":"Diet","value":"Vegan, gluten-free","label_fr":"Régime","value_fr":"Vegan, sans gluten","position":5},{"label":"Storage","value":"Refrigerated — best 15 min out before serving","label_fr":"Conservation","value_fr":"Réfrigérée — sortir 15 min avant de servir pour une texture plus crémeuse","position":6},{"label":"How to taste it","value":"Tahini, yogurt, or labneh · Bread · Desserts & pastries · Marinades & dressings · Beverages","label_fr":"Comment la déguster","value_fr":"Sur tahiné, yaourt ou labné · Sur pain · Dans les desserts & pâtisseries · Dans les marinades & vinaigrettes · Dans les boissons","position":7}]},{"handle":"tantour","name":"Tantour","kind":"carafe","status":"active","named_after_from":null,"description":"Bold and independent. Inspired by the Lebanese princesses who wore tantours, it embodies loyalty, strength, and elegance in every curve.","description_fr":"Affirmée et indépendante. Inspirée des princesses libanaises qui portaient le tantour, elle incarne la loyauté, la force et l'élégance dans chacune de ses courbes.","memory":null,"pull_quote":null,"position":4,"variants":[{"label":null,"price_cents":7500,"stock":10,"available":true,"position":0}],"images":[{"src":"/products/tantour-1.png","width":1531,"height":1027,"alt":"A row of tantour carafes in different glazes","position":0},{"src":"/products/tantour-3.png","width":1023,"height":1537,"alt":"A single tantour carafe beside a Malvina tin","position":1},{"src":"/products/tantour-2.png","width":1402,"height":1122,"alt":"A tantour carafe with fruit and lace in warm light","position":2}],"spec":[{"label":"Material","value":"Glazed ceramic","label_fr":"Matière","value_fr":"Céramique émaillée","position":0},{"label":"Craft","value":"Handcrafted in Beit Chabeb and Douma","label_fr":"Fabrication","value_fr":"Fabriquée à la main à Beit Chabeb et Douma","position":1}]},{"handle":"bri2-zeit","name":"Bri' Zeit","kind":"carafe","status":"active","named_after_from":null,"description":"Inspired by tradition, the Bri' shape evokes the old Lebanese saying that history repeats itself. A vessel for your everyday rituals.","description_fr":"Inspirée de la tradition, la forme Bri' évoque le vieux dicton libanais selon lequel l'histoire se répète. Un contenant pour vos rituels quotidiens.","memory":null,"pull_quote":null,"position":5,"variants":[{"label":null,"price_cents":6500,"stock":10,"available":true,"position":0}],"images":[{"src":"/products/bri2-zeit-2.png","width":1023,"height":1537,"alt":"The Bri' Zeit carafe with grapes and lace in warm golden light","position":0},{"src":"/products/bri2-zeit-1.png","width":1537,"height":1023,"alt":"The Bri' Zeit carafe on a wooden slab against black","position":1},{"src":"/products/bri2-zeit-3.png","width":1021,"height":1541,"alt":"Oil poured from the Bri' Zeit carafe into a coupe glass on an oxblood ground","position":2}],"spec":[{"label":"Material","value":"Glazed ceramic","label_fr":"Matière","value_fr":"Céramique émaillée","position":0},{"label":"Craft","value":"Handcrafted in Beit Chabeb and Douma","label_fr":"Fabrication","value_fr":"Fabriquée à la main à Beit Chabeb et Douma","position":1}]},{"handle":"costers","name":"Coaster","kind":"coaster","status":"active","named_after_from":null,"description":"More than a coaster. A piece of Lebanon, wherever you are. Made from authentic Lebanese cedar.","description_fr":"Plus qu'un dessous-de-verre. Un morceau du Liban, où que vous soyez. Taillé dans du véritable cèdre du Liban.","memory":null,"pull_quote":null,"position":6,"variants":[{"label":null,"price_cents":1000,"stock":10,"available":true,"position":0}],"images":[{"src":"/products/costers-1.png","width":943,"height":1668,"alt":"The quatrefoil coaster carved from Lebanese cedar on a near-black ground","position":0}],"spec":[{"label":"Material","value":"Lebanese cedar","label_fr":"Matière","value_fr":"Cèdre du Liban","position":0}]},{"handle":"najibe","name":"Najibe","kind":"olive-oil","status":"draft","named_after_from":"Zghorta","description":"Set high in the mountains of North Lebanon, Douma is a village where landscape and heritage are deeply intertwined. From the Chalhoub family, three generations in.","description_fr":"Perché dans les montagnes du Liban-Nord, Douma est un village où le paysage et le patrimoine sont intimement liés. De la famille Chalhoub, trois générations durant.","memory":"I am used to call her Najo with my grandmother Nazo, they were the Amar and Chamess together, the perfect duo. I remember one end of summer, I couldn't come to Lebanon in the traditional July–August so I came just one week in September and all I did was staying in Mehmarch in my mom's village with my grandmother Nazo and Najo, because it was heaven. Sun, their laughs, good food and dolce vita à la libanaise. Today, only my Amar is physically here, and that's why I am giving her the name of one of the best olive oils in Lebanon.","pull_quote":"They were the Amar and Chamess together, the perfect duo.","position":7,"variants":[{"label":"250 ml","price_cents":null,"stock":10,"available":true,"position":0},{"label":"1 L","price_cents":null,"stock":0,"available":false,"position":1},{"label":"3 L","price_cents":null,"stock":0,"available":false,"position":2}],"images":[{"src":"/products/najibe-4.png","width":1114,"height":1412,"alt":"Two Najibe tins on black","position":0},{"src":"/products/najibe-2.png","width":1537,"height":1023,"alt":"A single 1L Najibe tin","position":1}],"spec":[{"label":"Village","value":"Douma, North Lebanon","label_fr":"Village","value_fr":"Douma, Liban-Nord","position":0},{"label":"Family","value":"Chalhoub, 3rd generation","label_fr":"Famille","value_fr":"Chalhoub, 3e génération","position":1},{"label":"Harvest","value":"November","label_fr":"Récolte","value_fr":"Novembre","position":2},{"label":"Acidity","value":"< 0.5%","label_fr":"Acidité","value_fr":"< 0,5 %","position":3}]},{"handle":"nazira","name":"Teta Nazira","kind":"olive-oil","status":"draft","named_after_from":null,"description":"Coming soon","description_fr":"Bientôt disponible","memory":null,"pull_quote":null,"position":8,"variants":[{"label":null,"price_cents":null,"stock":10,"available":true,"position":0}],"images":[],"spec":[]},{"handle":"mimi-olive-oil","name":"Mimi","kind":"olive-oil","status":"draft","named_after_from":null,"description":"Coming soon","description_fr":"Bientôt disponible","memory":null,"pull_quote":null,"position":9,"variants":[{"label":"250 ml","price_cents":null,"stock":10,"available":true,"position":0},{"label":"1 L","price_cents":null,"stock":0,"available":false,"position":1},{"label":"3 L","price_cents":null,"stock":0,"available":false,"position":2}],"images":[],"spec":[]}]$zuruny_catalogue$::jsonb) as p (
    handle text,
    name text,
    kind text,
    status text,
    named_after_from text,
    description text,
    description_fr text,
    memory text,
    pull_quote text,
    position integer,
    variants jsonb,
    images jsonb,
    spec jsonb
  )
),
inserted as (
  insert into public.zuruny_products (
    handle, name, kind, status, named_after_from, description, description_fr,
    memory, pull_quote, position
  )
  select
    handle, name, kind, status, named_after_from, description, description_fr,
    memory, pull_quote, position
  from incoming
  on conflict (handle) do nothing
  returning id, handle
),
variants as (
  insert into public.zuruny_variants (
    product_id, label, price_cents, stock, available, position
  )
  select
    i.id,
    v.label,
    v.price_cents,
    v.stock,
    v.available,
    v.position
  from inserted as i
  join incoming as p on p.handle = i.handle
  cross join lateral jsonb_to_recordset(p.variants) as v (
    label text,
    price_cents integer,
    stock integer,
    available boolean,
    position integer
  )
  returning 1
),
images as (
  insert into public.zuruny_product_images (
    product_id, src, width, height, alt, position
  )
  select
    i.id,
    img.src,
    img.width,
    img.height,
    img.alt,
    img.position
  from inserted as i
  join incoming as p on p.handle = i.handle
  cross join lateral jsonb_to_recordset(p.images) as img (
    src text,
    width integer,
    height integer,
    alt text,
    position integer
  )
  returning 1
)
insert into public.zuruny_product_spec (
  product_id, label, value, label_fr, value_fr, position
)
select
  i.id,
  s.label,
  s.value,
  s.label_fr,
  s.value_fr,
  s.position
from inserted as i
join incoming as p on p.handle = i.handle
cross join lateral jsonb_to_recordset(p.spec) as s (
  label text,
  value text,
  label_fr text,
  value_fr text,
  position integer
);
