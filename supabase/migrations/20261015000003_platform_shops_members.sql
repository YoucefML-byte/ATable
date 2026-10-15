-- Platform, shops, members, devices and staff sessions.
-- Bible: vol. 04 §4.1, §4.2.

create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.shops (
  id                           uuid primary key default gen_random_uuid(),
  slug                         text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  name                         text not null check (char_length(name) between 1 and 80),
  business_type                public.business_type not null default 'restaurant',
  status                       public.shop_status not null default 'onboarding',
  timezone                     text not null default 'Europe/Paris',
  currency                     char(3) not null default 'EUR',
  locale                       text not null default 'fr-FR',
  -- Storefront
  welcome_message              text check (char_length(welcome_message) <= 500),
  opening_hours_text           text check (char_length(opening_hours_text) <= 500),
  address_text                 text check (char_length(address_text) <= 300),
  phone                        text check (char_length(phone) <= 30),
  -- Operations
  accepting_orders             boolean not null default true,
  public_menu_enabled          boolean not null default true,
  order_note_enabled           boolean not null default true,
  sold_out_label               text not null default 'Victime de son succès'
                               check (char_length(sold_out_label) between 1 and 40),
  price_notice                 text not null default 'Prix nets, service compris'
                               check (char_length(price_notice) <= 120),
  business_day_start           time not null default '05:00',
  kitchen_warning_minutes      smallint not null default 10 check (kitchen_warning_minutes between 1 and 240),
  kitchen_critical_minutes     smallint not null default 20 check (kitchen_critical_minutes between 2 and 480),
  floor_alert_repeat_seconds   smallint not null default 30 check (floor_alert_repeat_seconds between 0 and 600),
  staff_idle_lock_minutes      smallint not null default 10 check (staff_idle_lock_minutes between 1 and 120),
  -- Anti-abuse
  max_orders_per_client_10min  smallint not null default 5 check (max_orders_per_client_10min between 1 and 50),
  max_pending_orders_per_table smallint not null default 10 check (max_pending_orders_per_table between 1 and 100),
  max_lines_per_order          smallint not null default 30 check (max_lines_per_order between 1 and 200),
  max_quantity_per_line        smallint not null default 20 check (max_quantity_per_line between 1 and 200),
  max_order_total_cents        integer not null default 50000 check (max_order_total_cents between 1 and 10000000),
  -- Legal notice (the shop is the publisher of its site)
  legal_name                   text check (char_length(legal_name) <= 120),
  legal_form                   text check (char_length(legal_form) <= 60),
  legal_siret                  text check (legal_siret is null or legal_siret ~ '^[0-9]{14}$'),
  legal_address                text check (char_length(legal_address) <= 300),
  legal_publication_director   text check (char_length(legal_publication_director) <= 120),
  -- Optional features enabled by the platform
  features                     text[] not null default '{}',
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  archived_at                  timestamptz,
  constraint kitchen_thresholds_ordered check (kitchen_critical_minutes > kitchen_warning_minutes),
  constraint timezone_valid check ((timestamptz '2000-01-01 00:00+00' at time zone timezone) is not null)
);
create trigger shops_updated_at before update on public.shops
  for each row execute function private.set_updated_at();

create table public.shop_domains (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops (id) on delete cascade,
  hostname       text not null unique
                 check (hostname = lower(hostname) and hostname !~ '[^a-z0-9.-]' and char_length(hostname) <= 253),
  kind           public.domain_kind not null,
  is_primary     boolean not null default false,
  verified_at    timestamptz,
  provider_state jsonb not null default '{}', -- last state returned by the Vercel API
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index shop_domains_one_primary on public.shop_domains (shop_id) where is_primary;
create index shop_domains_shop on public.shop_domains (shop_id);
create trigger shop_domains_updated_at before update on public.shop_domains
  for each row execute function private.set_updated_at();

create table public.shop_themes (
  shop_id       uuid primary key references public.shops (id) on delete cascade,
  preset        text not null default 'classique' check (preset ~ '^[a-z0-9-]{1,60}$'),
  primary_color text not null default '#1F4D3A' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color  text not null default '#E0A33A' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  font_pair     text not null default 'classique'
                check (font_pair in ('classique', 'bistrot', 'moderne', 'street', 'elegant', 'doux')),
  radius        text not null default 'doux' check (radius in ('carre', 'doux', 'arrondi')),
  density       text not null default 'aeree' check (density in ('compacte', 'aeree')),
  menu_layout   text not null default 'liste' check (menu_layout in ('liste', 'grille', 'minimaliste')),
  color_scheme  text not null default 'clair' check (color_scheme in ('clair', 'sombre', 'auto')),
  logo_path     text,
  cover_path    text,
  updated_at    timestamptz not null default now()
);
create trigger shop_themes_updated_at before update on public.shop_themes
  for each row execute function private.set_updated_at();

create table public.shop_billing (
  shop_id           uuid primary key references public.shops (id) on delete cascade,
  setup_fee_cents   integer check (setup_fee_cents >= 0),
  setup_paid_at     date,
  monthly_fee_cents integer check (monthly_fee_cents >= 0),
  status            public.billing_status not null default 'trial',
  next_due_on       date,
  notes             text check (char_length(notes) <= 2000),
  updated_at        timestamptz not null default now()
);
create trigger shop_billing_updated_at before update on public.shop_billing
  for each row execute function private.set_updated_at();

create table public.shop_members (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  role             public.member_role not null,
  display_name     text not null check (char_length(display_name) between 1 and 40),
  color            text not null default '#64748B' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  permissions      text[] not null default '{floor,stock}'
                   check (permissions <@ array['floor', 'kitchen', 'stock']::text[]),
  pin_hash         text,                            -- Argon2id, staff only
  pin_failed_count smallint not null default 0,
  pin_lock_level   smallint not null default 0,      -- number of successive lockouts
  pin_locked_until timestamptz,
  pin_hard_locked  boolean not null default false,   -- owner must unlock
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deactivated_at   timestamptz,
  unique (shop_id, user_id),
  constraint staff_has_pin check (role = 'owner' or pin_hash is not null)
);
create index shop_members_user on public.shop_members (user_id) where is_active;
create index shop_members_shop on public.shop_members (shop_id);
create trigger shop_members_updated_at before update on public.shop_members
  for each row execute function private.set_updated_at();

create table public.devices (
  id                           uuid primary key default gen_random_uuid(),
  shop_id                      uuid not null references public.shops (id) on delete cascade,
  name                         text not null check (char_length(name) between 1 and 40),
  secret_hash                  text not null unique, -- SHA-256 of a random 256-bit secret
  enrolled_by                  uuid not null references public.shop_members (id),
  enrolled_at                  timestamptz not null default now(),
  last_seen_at                 timestamptz,
  failed_attempts_window_start timestamptz,
  failed_attempts              smallint not null default 0,
  locked                       boolean not null default false,
  revoked_at                   timestamptz,
  revoked_by                   uuid references public.shop_members (id)
);
create index devices_shop on public.devices (shop_id) where revoked_at is null;

create table public.staff_sessions (
  session_id     uuid primary key,                   -- `session_id` claim of the Supabase JWT
  shop_id        uuid not null references public.shops (id) on delete cascade,
  member_id      uuid not null references public.shop_members (id) on delete cascade,
  device_id      uuid not null references public.devices (id) on delete cascade,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  last_seen_at   timestamptz,
  revoked_at     timestamptz,
  revoked_reason text check (char_length(revoked_reason) <= 60)
);
create index staff_sessions_member on public.staff_sessions (member_id) where revoked_at is null;
create index staff_sessions_shop on public.staff_sessions (shop_id);
create index staff_sessions_device on public.staff_sessions (device_id) where revoked_at is null;

alter table public.platform_admins enable row level security;
alter table public.shops enable row level security;
alter table public.shop_domains enable row level security;
alter table public.shop_themes enable row level security;
alter table public.shop_billing enable row level security;
alter table public.shop_members enable row level security;
alter table public.devices enable row level security;
alter table public.staff_sessions enable row level security;
