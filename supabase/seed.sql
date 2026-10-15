-- Demo data — LOCAL AND STAGING ONLY. Never applied in production.
-- Bible: vol. 04 §14.
--
-- Accounts (local only):
--   Platform admin : admin@atable.test        / Console-Demo-2026!   TOTP secret JBSWY3DPEHPK3PXP
--   Bistrot owner  : karim@bistrot.test       / Bistrot-Demo-2026!   TOTP secret KRSXG5CTMVRXEZLU
--   Lounge owner   : samia@lounge.test        / Lounge-Demo-2026!    TOTP secret GEZDGNBVGY3TQOJQ
--   Bistrot staff PINs : Léa 241608 (Salle+Stock), Mehdi 739215 (Cuisine), Sofia 518374 (tout)
--   Lounge staff PINs  : Inès 362951 (Salle+Stock), Yanis 847120 (Cuisine), Nora 905263 (tout)
-- Hosts: bistrot.localhost:3000, lounge.localhost:3000, pro.localhost:3000, console.localhost:3000

-- ---------------------------------------------------------------------------
-- Auth users
-- ---------------------------------------------------------------------------
create or replace function pg_temp.mk_user(p_id uuid, p_email text, p_password text)
returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at,
                               created_at, updated_at)
  values (gen_random_uuid(), p_id, jsonb_build_object('sub', p_id::text, 'email', p_email), 'email',
          p_id::text, now(), now(), now());
end;
$$;

create or replace function pg_temp.mk_totp(p_user uuid, p_secret text)
returns void language sql as $$
  insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
  values (gen_random_uuid(), p_user, 'Démo', 'totp', 'verified', now(), now(), p_secret);
$$;

select pg_temp.mk_user('a0000000-0000-4000-8000-000000000001', 'admin@atable.test', 'Console-Demo-2026!');
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000002', 'karim@bistrot.test', 'Bistrot-Demo-2026!');
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000003', 'samia@lounge.test', 'Lounge-Demo-2026!');
select pg_temp.mk_totp('a0000000-0000-4000-8000-000000000001', 'JBSWY3DPEHPK3PXP');
select pg_temp.mk_totp('a0000000-0000-4000-8000-000000000002', 'KRSXG5CTMVRXEZLU');
select pg_temp.mk_totp('a0000000-0000-4000-8000-000000000003', 'GEZDGNBVGY3TQOJQ');

-- Staff technical users (fictitious non-routable addresses, random passwords nobody knows).
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000011@staff.atable.invalid', encode(gen_random_bytes(32), 'hex'));
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000012@staff.atable.invalid', encode(gen_random_bytes(32), 'hex'));
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000013@staff.atable.invalid', encode(gen_random_bytes(32), 'hex'));
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000021', 'b2000000-0000-4000-8000-000000000021@staff.atable.invalid', encode(gen_random_bytes(32), 'hex'));
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000022', 'b2000000-0000-4000-8000-000000000022@staff.atable.invalid', encode(gen_random_bytes(32), 'hex'));
select pg_temp.mk_user('a0000000-0000-4000-8000-000000000023', 'b2000000-0000-4000-8000-000000000023@staff.atable.invalid', encode(gen_random_bytes(32), 'hex'));

insert into public.platform_admins (user_id) values ('a0000000-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- Shops
-- ---------------------------------------------------------------------------
insert into public.shops (id, slug, name, business_type, status, welcome_message, opening_hours_text,
                          address_text, phone, legal_name, legal_form, legal_siret, legal_address,
                          legal_publication_director)
values
  ('c1000000-0000-4000-8000-000000000001', 'bistrot', 'Le Bistrot Démo', 'restaurant', 'active',
   'Bienvenue ! Commandez quand vous voulez, on s''occupe du reste.',
   'Midi : 11 h 30 – 15 h · Soir : 18 h 30 – 23 h, 7 jours sur 7', '12 rue de la Démo, 75011 Paris',
   '01 23 45 67 89', 'Bistrot Démo SAS', 'SAS', '12345678900011', '12 rue de la Démo, 75011 Paris',
   'Karim Démo'),
  ('c2000000-0000-4000-8000-000000000002', 'lounge', 'Le Lounge Démo', 'lounge', 'active',
   'Installez-vous, on vous apporte tout à table.',
   'Tous les soirs de 18 h à 4 h', '8 avenue de la Démo, 69003 Lyon', '04 12 34 56 78',
   'Lounge Démo SARL', 'SARL', '98765432100022', '8 avenue de la Démo, 69003 Lyon', 'Samia Démo');

update public.shops set business_day_start = '06:00' where id = 'c2000000-0000-4000-8000-000000000002';

insert into public.shop_domains (shop_id, hostname, kind, is_primary, verified_at) values
  ('c1000000-0000-4000-8000-000000000001', 'bistrot.localhost', 'platform', true, now()),
  ('c2000000-0000-4000-8000-000000000002', 'lounge.localhost', 'platform', true, now());

insert into public.shop_themes (shop_id, preset, primary_color, accent_color, font_pair, radius, density, menu_layout, color_scheme) values
  ('c1000000-0000-4000-8000-000000000001', 'brasserie', '#7A2E1F', '#D9A441', 'bistrot', 'doux', 'aeree', 'liste', 'clair'),
  ('c2000000-0000-4000-8000-000000000002', 'lounge', '#3B1F5C', '#E3B04B', 'elegant', 'arrondi', 'aeree', 'grille', 'sombre');

insert into public.shop_billing (shop_id, setup_fee_cents, setup_paid_at, monthly_fee_cents, status, next_due_on) values
  ('c1000000-0000-4000-8000-000000000001', 120000, current_date - 60, 4500, 'active', current_date + 15),
  ('c2000000-0000-4000-8000-000000000002', 150000, current_date - 45, 4500, 'past_due', current_date - 3);

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
insert into public.shop_members (id, shop_id, user_id, role, display_name, color, permissions, pin_hash) values
  ('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'owner', 'Karim', '#7A2E1F', '{floor,kitchen,stock}', null),
  ('b1000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000011', 'staff', 'Léa', '#0E7490', '{floor,stock}',
   '$argon2id$v=19$m=19456,t=2,p=1$rp96TNjf/IuCmh/Jy90luw$r57XIm8mNk547Ky9LtBRtS+zP1b4Q6nJP0tOgRA6/3s'),
  ('b1000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000012', 'staff', 'Mehdi', '#B45309', '{kitchen}',
   '$argon2id$v=19$m=19456,t=2,p=1$iFWQr+NtDqiVgeEfbKNC4Q$bDx1d1U3nJEQcPK6KNd7wKBMvJU2PzNt5r16yLJHQ0o'),
  ('b1000000-0000-4000-8000-000000000013', 'c1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000013', 'staff', 'Sofia', '#6D28D9', '{floor,kitchen,stock}',
   '$argon2id$v=19$m=19456,t=2,p=1$eo5TFETP4BJxUaNjytvjIA$QFwPCimzV/Paf06mig2+dU64/QQa3OrpQTQXiTJ8mOY'),
  ('b2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'owner', 'Samia', '#3B1F5C', '{floor,kitchen,stock}', null),
  ('b2000000-0000-4000-8000-000000000021', 'c2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000021', 'staff', 'Inès', '#0E7490', '{floor,stock}',
   '$argon2id$v=19$m=19456,t=2,p=1$p2qCTfHowaJ/8SU1/TMdCQ$0SXXh6gnX4F1Vktz6EL2cltTIAcZSy0OfJZXxcPXXuU'),
  ('b2000000-0000-4000-8000-000000000022', 'c2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000022', 'staff', 'Yanis', '#B45309', '{kitchen}',
   '$argon2id$v=19$m=19456,t=2,p=1$4woZb95wN709OjWXzod7XQ$AMO7TyJjzk1OcQgUnwKIZ7nbyyBmZ0ljsRSjImaHVx0'),
  ('b2000000-0000-4000-8000-000000000023', 'c2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000023', 'staff', 'Nora', '#6D28D9', '{floor,kitchen,stock}',
   '$argon2id$v=19$m=19456,t=2,p=1$/F3CixbqthQVRF8RuY9KrA$712u5AXPtrRSmR2iQ88WTUW7+KrTjUBmxdnkRvnyEXI');

-- ---------------------------------------------------------------------------
-- Catalog — Le Bistrot Démo
-- ---------------------------------------------------------------------------
insert into public.menus (id, shop_id, name, description, position, is_default) values
  ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Carte du midi', 'Du lundi au dimanche, 11 h 30 – 15 h', 1, true),
  ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Carte du soir', 'Tous les soirs, 18 h 30 – 23 h', 2, false),
  ('d1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'Boissons et desserts', 'Toute la journée', 3, false);

insert into public.menu_schedules (shop_id, menu_id, days, start_time, end_time) values
  ('c1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', '{1,2,3,4,5,6,7}', '11:30', '15:00'),
  ('c1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002', '{1,2,3,4,5,6,7}', '18:30', '23:00');

insert into public.categories (id, shop_id, name, description, prep_station, position) values
  ('e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Entrées', null, 'kitchen', 1),
  ('e1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Plats', null, 'kitchen', 2),
  ('e1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'Tacos', 'Composez le vôtre', 'kitchen', 3),
  ('e1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 'Desserts', null, 'kitchen', 4),
  ('e1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 'Boissons chaudes', null, 'bar', 5),
  ('e1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 'Boissons fraîches', null, 'none', 6);

insert into public.menu_categories (menu_id, category_id, shop_id, position) values
  ('d1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 1),
  ('d1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 2),
  ('d1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 3),
  ('d1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 1),
  ('d1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 2),
  ('d1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 3),
  ('d1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 4),
  ('d1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 5),
  ('d1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 6);

insert into public.products (id, shop_id, category_id, name, description, base_price_cents, tags, origin_info, allergens_declared_at, position) values
  -- Entrées
  ('f1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Velouté du moment', 'Légumes de saison, crème légère', 750, '{vegetarian,homemade}', null, now(), 1),
  ('f1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Œuf mayonnaise', 'Le classique du bistrot', 650, '{vegetarian}', null, now(), 2),
  ('f1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Burrata crémeuse', 'Tomates anciennes, pesto basilic', 1150, '{vegetarian,new}', null, now(), 3),
  ('f1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Planche de charcuterie', 'À partager', 1450, '{}', 'Porc origine France', now(), 4),
  ('f1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'Salade de chèvre chaud', null, 1050, '{vegetarian}', null, null, 5),
  -- Plats
  ('f1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Burger maison', 'Bœuf, cheddar affiné, frites maison', 1400, '{homemade,signature}', 'Bœuf origine France', now(), 1),
  ('f1000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Entrecôte grillée', 'Environ 300 g, sauce au choix', 2400, '{}', 'Bœuf origine France', now(), 2),
  ('f1000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Poulet rôti', 'Jus corsé, purée maison', 1650, '{homemade}', 'Volaille origine France', now(), 3),
  ('f1000000-0000-4000-8000-000000000009', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Risotto aux champignons', null, 1550, '{vegetarian}', null, now(), 4),
  ('f1000000-0000-4000-8000-000000000010', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Fish and chips', 'Cabillaud pané, sauce tartare', 1700, '{}', null, now(), 5),
  ('f1000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Croque-monsieur', 'Jambon blanc, béchamel, salade', 1200, '{}', null, now(), 6),
  ('f1000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Salade César', null, 1450, '{}', null, now(), 7),
  -- Tacos
  ('f1000000-0000-4000-8000-000000000013', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', 'Tacos 2 viandes', 'Galette, frites, 2 viandes au choix, sauce fromagère', 950, '{spicy}', 'Poulet origine France', now(), 1),
  ('f1000000-0000-4000-8000-000000000014', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', 'Tacos 3 viandes', 'Pour les grosses faims', 1200, '{spicy}', 'Poulet origine France', now(), 2),
  ('f1000000-0000-4000-8000-000000000015', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000003', 'Frites maison', 'Taille au choix', 400, '{vegan,homemade}', null, now(), 3),
  -- Desserts
  ('f1000000-0000-4000-8000-000000000016', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000004', 'Tiramisu', 'Recette de la maison', 650, '{homemade}', null, now(), 1),
  ('f1000000-0000-4000-8000-000000000017', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000004', 'Mousse au chocolat', null, 600, '{homemade}', null, now(), 2),
  ('f1000000-0000-4000-8000-000000000018', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000004', 'Crème brûlée', null, 650, '{}', null, now(), 3),
  ('f1000000-0000-4000-8000-000000000019', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000004', 'Café gourmand', 'Café et trois mignardises', 850, '{}', null, now(), 4),
  ('f1000000-0000-4000-8000-000000000020', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000004', 'Coupe de glace', '2 boules au choix', 550, '{}', null, now(), 5),
  -- Boissons chaudes
  ('f1000000-0000-4000-8000-000000000021', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000005', 'Café', null, 180, '{vegan}', null, now(), 1),
  ('f1000000-0000-4000-8000-000000000022', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000005', 'Café crème', null, 350, '{}', null, now(), 2),
  ('f1000000-0000-4000-8000-000000000023', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000005', 'Chocolat chaud', 'Taille au choix', 400, '{}', null, now(), 3),
  ('f1000000-0000-4000-8000-000000000024', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000005', 'Thé', 'Vert, noir ou infusion', 350, '{vegan}', null, now(), 4),
  -- Boissons fraîches (no preparation)
  ('f1000000-0000-4000-8000-000000000025', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006', 'Eau minérale 50 cl', null, 350, '{vegan}', null, now(), 1),
  ('f1000000-0000-4000-8000-000000000026', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006', 'Soda 33 cl', 'Cola, citron ou orange', 400, '{vegan}', null, now(), 2),
  ('f1000000-0000-4000-8000-000000000027', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006', 'Jus de fruits', 'Pomme, orange ou ananas', 450, '{vegan}', null, now(), 3),
  ('f1000000-0000-4000-8000-000000000028', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006', 'Limonade artisanale', null, 500, '{vegan,new}', null, now(), 4),
  ('f1000000-0000-4000-8000-000000000029', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006', 'Thé glacé maison', null, 500, '{vegan,homemade}', null, now(), 5),
  ('f1000000-0000-4000-8000-000000000030', 'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006', 'Sirop à l''eau', null, 250, '{vegan}', null, now(), 6);

-- Option groups (Bistrot)
insert into public.option_groups (id, shop_id, name, internal_name, min_select, max_select, allow_quantity, max_per_option, position) values
  ('91000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Viandes', 'Viandes tacos', 2, 2, false, 1, 1),
  ('91000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Choisissez vos sauces', 'Sauces tacos', 0, 3, false, 1, 2),
  ('91000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'Gratiné', null, 0, 1, false, 1, 3),
  ('91000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 'Suppléments', null, 0, null, true, 2, 4),
  ('91000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 'Taille', 'Tailles S/M/L', 1, 1, false, 1, 5),
  ('91000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 'Cuisson', 'Cuisson viande', 1, 1, false, 1, 6),
  ('91000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000001', 'Sauce', 'Sauce viande', 0, 1, false, 1, 7);

insert into public.options (id, shop_id, group_id, name, price_delta_cents, is_default, allergens_declared_at, position) values
  ('92000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Poulet', 0, false, now(), 1),
  ('92000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Kebab', 0, false, now(), 2),
  ('92000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Merguez', 0, false, now(), 3),
  ('92000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Cordon bleu', 0, false, now(), 4),
  ('92000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'Algérienne', 0, false, now(), 1),
  ('92000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'Samouraï', 0, false, now(), 2),
  ('92000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'Blanche', 0, false, now(), 3),
  ('92000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'Harissa', 0, false, now(), 4),
  ('92000000-0000-4000-8000-000000000009', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000003', 'Gratiné au fromage', 100, false, now(), 1),
  ('92000000-0000-4000-8000-000000000010', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000004', 'Supplément fromage', 100, false, now(), 1),
  ('92000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000004', 'Supplément viande', 250, false, now(), 2),
  ('92000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000005', 'S', 0, false, now(), 1),
  ('92000000-0000-4000-8000-000000000013', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000005', 'M', 50, true, now(), 2),
  ('92000000-0000-4000-8000-000000000014', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000005', 'L', 100, false, now(), 3),
  ('92000000-0000-4000-8000-000000000015', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000006', 'Bleue', 0, false, now(), 1),
  ('92000000-0000-4000-8000-000000000016', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000006', 'Saignante', 0, false, now(), 2),
  ('92000000-0000-4000-8000-000000000017', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000006', 'À point', 0, true, now(), 3),
  ('92000000-0000-4000-8000-000000000018', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000006', 'Bien cuite', 0, false, now(), 4),
  ('92000000-0000-4000-8000-000000000019', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000007', 'Poivre', 150, false, now(), 1),
  ('92000000-0000-4000-8000-000000000020', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000007', 'Roquefort', 150, false, now(), 2),
  ('92000000-0000-4000-8000-000000000021', 'c1000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000007', 'Béarnaise', 150, false, now(), 3);

update public.options set is_sold_out = true where id = '92000000-0000-4000-8000-000000000008'; -- Harissa

insert into public.product_option_groups (product_id, group_id, shop_id, position, min_override, max_override) values
  ('f1000000-0000-4000-8000-000000000013', '91000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 1, null, null),
  ('f1000000-0000-4000-8000-000000000013', '91000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 2, null, null),
  ('f1000000-0000-4000-8000-000000000013', '91000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 3, null, null),
  ('f1000000-0000-4000-8000-000000000013', '91000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 4, null, null),
  ('f1000000-0000-4000-8000-000000000014', '91000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 1, 3, 3),
  ('f1000000-0000-4000-8000-000000000014', '91000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 2, null, null),
  ('f1000000-0000-4000-8000-000000000014', '91000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 3, null, null),
  ('f1000000-0000-4000-8000-000000000014', '91000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000001', 4, null, null),
  ('f1000000-0000-4000-8000-000000000015', '91000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 1, null, null),
  ('f1000000-0000-4000-8000-000000000023', '91000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000001', 1, null, null),
  ('f1000000-0000-4000-8000-000000000007', '91000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 1, null, null),
  ('f1000000-0000-4000-8000-000000000007', '91000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000001', 2, null, null),
  ('f1000000-0000-4000-8000-000000000006', '91000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 1, null, null);

insert into public.product_allergens (product_id, allergen_code, shop_id, presence) values
  ('f1000000-0000-4000-8000-000000000001', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000001', 'celery', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000002', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000002', 'mustard', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000003', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000003', 'nuts', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000006', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000006', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000006', 'sesame', 'c1000000-0000-4000-8000-000000000001', 'may_contain'),
  ('f1000000-0000-4000-8000-000000000009', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000010', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000010', 'fish', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000010', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000011', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000011', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000012', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000012', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000012', 'fish', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000013', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000013', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000014', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000014', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000016', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000016', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000016', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000017', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000017', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000018', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000018', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000019', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000019', 'nuts', 'c1000000-0000-4000-8000-000000000001', 'may_contain'),
  ('f1000000-0000-4000-8000-000000000020', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000022', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('f1000000-0000-4000-8000-000000000023', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains');

insert into public.option_allergens (option_id, allergen_code, shop_id, presence) values
  ('92000000-0000-4000-8000-000000000004', 'gluten', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('92000000-0000-4000-8000-000000000004', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('92000000-0000-4000-8000-000000000005', 'eggs', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('92000000-0000-4000-8000-000000000005', 'mustard', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('92000000-0000-4000-8000-000000000009', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('92000000-0000-4000-8000-000000000010', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains'),
  ('92000000-0000-4000-8000-000000000020', 'milk', 'c1000000-0000-4000-8000-000000000001', 'contains');

-- ---------------------------------------------------------------------------
-- Catalog — Le Lounge Démo (single menu, night hours, business day starting at 6:00)
-- ---------------------------------------------------------------------------
insert into public.menus (id, shop_id, name, position, is_default) values
  ('d2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 'Carte', 1, true);
insert into public.menu_schedules (shop_id, menu_id, days, start_time, end_time) values
  ('c2000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001', '{1,2,3,4,5,6,7}', '18:00', '04:00');

insert into public.categories (id, shop_id, name, prep_station, position) values
  ('e2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 'Chichas', 'bar', 1),
  ('e2000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'Cocktails sans alcool', 'bar', 2),
  ('e2000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000002', 'Thés et cafés', 'bar', 3),
  ('e2000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000002', 'Softs', 'none', 4),
  ('e2000000-0000-4000-8000-000000000005', 'c2000000-0000-4000-8000-000000000002', 'À grignoter', 'kitchen', 5);
insert into public.menu_categories (menu_id, category_id, shop_id, position)
select 'd2000000-0000-4000-8000-000000000001', id, shop_id, position
from public.categories where shop_id = 'c2000000-0000-4000-8000-000000000002';

insert into public.products (id, shop_id, category_id, name, description, base_price_cents, tags, allergens_declared_at, position) values
  ('f2000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'Chicha classique', 'Un goût au choix', 1800, '{}', now(), 1),
  ('f2000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'Chicha mélange', 'Jusqu''à 3 goûts', 2200, '{signature}', now(), 2),
  ('f2000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'Recharge', null, 800, '{}', now(), 3),
  ('f2000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Virgin mojito', null, 900, '{vegan}', now(), 1),
  ('f2000000-0000-4000-8000-000000000005', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Piña colada sans alcool', null, 1000, '{}', now(), 2),
  ('f2000000-0000-4000-8000-000000000006', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002', 'Cocktail du moment', null, 1100, '{new}', now(), 3),
  ('f2000000-0000-4000-8000-000000000007', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000003', 'Thé à la menthe', 'La théière', 600, '{vegan}', now(), 1),
  ('f2000000-0000-4000-8000-000000000008', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000003', 'Café', null, 250, '{vegan}', now(), 2),
  ('f2000000-0000-4000-8000-000000000009', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000003', 'Chocolat chaud', null, 450, '{}', now(), 3),
  ('f2000000-0000-4000-8000-000000000010', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000004', 'Soda 33 cl', null, 450, '{vegan}', now(), 1),
  ('f2000000-0000-4000-8000-000000000011', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000004', 'Eau pétillante', null, 400, '{vegan}', now(), 2),
  ('f2000000-0000-4000-8000-000000000012', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000005', 'Assiette de pâtisseries orientales', null, 900, '{homemade}', now(), 1),
  ('f2000000-0000-4000-8000-000000000013', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000005', 'Nachos', 'Sauce fromagère', 750, '{vegetarian}', now(), 2),
  ('f2000000-0000-4000-8000-000000000014', 'c2000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000005', 'Planche apéritive', 'À partager', 1400, '{}', now(), 3);

insert into public.option_groups (id, shop_id, name, internal_name, min_select, max_select, position) values
  ('93000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 'Goût', 'Goût unique', 1, 1, 1),
  ('93000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'Goûts (jusqu''à 3)', 'Mélange', 2, 3, 2);
insert into public.options (id, shop_id, group_id, name, price_delta_cents, allergens_declared_at, position)
select gen_random_uuid(), 'c2000000-0000-4000-8000-000000000002', g.id, t.name, 0, now(), t.pos
from (values ('Menthe', 1), ('Pomme', 2), ('Raisin', 3), ('Pastèque', 4), ('Fruits rouges', 5), ('Love 66', 6)) as t(name, pos)
cross join (values ('93000000-0000-4000-8000-000000000001'::uuid), ('93000000-0000-4000-8000-000000000002'::uuid)) as g(id);
insert into public.product_option_groups (product_id, group_id, shop_id, position) values
  ('f2000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 1),
  ('f2000000-0000-4000-8000-000000000003', '93000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 1),
  ('f2000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 1);
insert into public.product_allergens (product_id, allergen_code, shop_id, presence) values
  ('f2000000-0000-4000-8000-000000000005', 'milk', 'c2000000-0000-4000-8000-000000000002', 'contains'),
  ('f2000000-0000-4000-8000-000000000009', 'milk', 'c2000000-0000-4000-8000-000000000002', 'contains'),
  ('f2000000-0000-4000-8000-000000000012', 'gluten', 'c2000000-0000-4000-8000-000000000002', 'contains'),
  ('f2000000-0000-4000-8000-000000000012', 'nuts', 'c2000000-0000-4000-8000-000000000002', 'contains'),
  ('f2000000-0000-4000-8000-000000000013', 'milk', 'c2000000-0000-4000-8000-000000000002', 'contains');

-- ---------------------------------------------------------------------------
-- Tables and tokens (10 per shop). Tokens are fixed in demo data so that `pnpm demo:qr` works.
-- ---------------------------------------------------------------------------
insert into public.dining_tables (id, shop_id, label, zone, seats, position)
select ('71000000-0000-4000-8000-0000000000' || lpad(i::text, 2, '0'))::uuid,
       'c1000000-0000-4000-8000-000000000001',
       case when i <= 6 then 'Table ' || i else 'Terrasse ' || (i - 6) end,
       case when i <= 6 then 'Salle' else 'Terrasse' end, 4, i
from generate_series(1, 10) as i;
insert into public.dining_tables (id, shop_id, label, zone, seats, position)
select ('72000000-0000-4000-8000-0000000000' || lpad(i::text, 2, '0'))::uuid,
       'c2000000-0000-4000-8000-000000000002',
       case when i <= 7 then 'Banquette ' || i else 'Bar ' || (i - 7) end,
       case when i <= 7 then 'Salon' else 'Bar' end, 6, i
from generate_series(1, 10) as i;
insert into public.table_tokens (shop_id, table_id, token)
select shop_id, id,
       (case when shop_id = 'c1000000-0000-4000-8000-000000000001' then 'demoBistrotTable' else 'demoLoungeTable0' end)
       || lpad(position::text, 6, '0')
from public.dining_tables;

-- ---------------------------------------------------------------------------
-- 60 days of realistic order history (lunch and evening rushes, busier weekends)
-- ---------------------------------------------------------------------------
do $$
declare
  v_shop     record;
  v_day      date;
  v_today    date;
  v_n        integer;
  v_k        integer;
  v_number   integer;
  v_table    uuid;
  v_session  uuid;
  v_order    uuid;
  v_at       timestamptz;
  v_hour     numeric;
  v_status   public.order_status;
  v_lines    integer;
  v_prod     record;
  v_qty      integer;
  v_total    integer;
  v_count    integer;
  v_reason   text;
  v_member   uuid;
begin
  perform setseed(0.42);
  for v_shop in select id, timezone from public.shops loop
    v_today := private.business_day(v_shop.id, now());
    select id into v_member from public.shop_members where shop_id = v_shop.id and role = 'staff' order by id limit 1;
    for v_day in select generate_series(v_today - 60, v_today - 1, interval '1 day')::date loop
      v_n := 18 + floor(random() * 18)::int + case when extract(isodow from v_day) in (5, 6) then 22 else 0 end;
      v_number := 0;
      for v_k in 1 .. v_n loop
        -- Bistrot: lunch or evening rush; Lounge: evening and night.
        if v_shop.id = 'c1000000-0000-4000-8000-000000000001' then
          v_hour := case when random() < 0.45 then 12 + random() * 2.5 else 19 + random() * 3.5 end;
          v_at := ((v_day + make_interval(secs => v_hour * 3600)) at time zone v_shop.timezone);
        else
          v_hour := 19 + random() * 8; -- 19:00 → 03:00
          v_at := ((v_day + make_interval(secs => v_hour * 3600)) at time zone v_shop.timezone);
        end if;
        select id into v_table from public.dining_tables where shop_id = v_shop.id order by random() limit 1;
        insert into public.table_sessions (shop_id, table_id, opened_at, closed_at, business_day)
        values (v_shop.id, v_table, v_at, v_at + interval '75 minutes', v_day)
        returning id into v_session;
        v_number := v_number + 1;
        v_status := case when random() < 0.025 then 'rejected'::public.order_status
                         when random() < 0.01 then 'cancelled'::public.order_status
                         else 'served'::public.order_status end;
        v_reason := case when v_status = 'rejected' then (array['Personne à la table', 'Commande en double', 'Produit indisponible'])[1 + floor(random() * 3)::int]
                         when v_status = 'cancelled' then 'Client parti' end;
        insert into public.orders (shop_id, table_id, table_session_id, business_day, number, status, source,
                                   idempotency_key, created_at, accepted_at, accepted_by, ready_at, served_at,
                                   rejected_at, cancelled_at, internal_reason)
        values (v_shop.id, v_table, v_session, v_day, v_number, v_status,
                case when random() < 0.2 then 'nfc'::public.order_source else 'qr'::public.order_source end,
                gen_random_uuid(), v_at,
                case when v_status <> 'rejected' then v_at + make_interval(secs => 30 + random() * 120) end,
                case when v_status <> 'rejected' then v_member end,
                case when v_status = 'served' then v_at + make_interval(mins => 6 + (random() * 14)::int) end,
                case when v_status = 'served' then v_at + make_interval(mins => 22) end,
                case when v_status = 'rejected' then v_at + interval '1 minute' end,
                case when v_status = 'cancelled' then v_at + interval '5 minutes' end,
                v_reason)
        returning id into v_order;
        v_lines := 1 + floor(random() * 4)::int;
        v_total := 0; v_count := 0;
        for v_prod in
          select p.id, p.name, p.base_price_cents, c.name as cat, c.prep_station
          from public.products p join public.categories c on c.id = p.category_id
          where p.shop_id = v_shop.id
          order by random() * (case when p.position <= 2 then 0.4 else 1 end) limit v_lines
        loop
          v_qty := 1 + floor(random() * random() * 3)::int;
          insert into public.order_items (order_id, shop_id, product_id, product_name, category_name, prep_station,
                                          base_price_cents, unit_price_cents, quantity, line_total_cents, position)
          values (v_order, v_shop.id, v_prod.id, v_prod.name, v_prod.cat, v_prod.prep_station,
                  v_prod.base_price_cents, v_prod.base_price_cents, v_qty, v_prod.base_price_cents * v_qty, v_count + 1);
          v_total := v_total + v_prod.base_price_cents * v_qty;
          v_count := v_count + v_qty;
        end loop;
        update public.orders set subtotal_cents = v_total, item_count = v_count where id = v_order;
        update public.table_sessions
           set total_cents = case when v_status in ('rejected', 'cancelled') then 0 else v_total end
         where id = v_session;
      end loop;
      insert into public.shop_daily_counters (shop_id, business_day, last_number) values (v_shop.id, v_day, v_number);
    end loop;
  end loop;
end;
$$;

-- History generation must not pollute the audit log with fake entries.
delete from public.audit_log;
delete from realtime.messages;
