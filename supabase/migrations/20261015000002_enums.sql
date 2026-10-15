-- Enumerated types. Bible: vol. 04 §3.

create type public.shop_status as enum ('onboarding', 'active', 'suspended', 'archived');
create type public.business_type as enum (
  'restaurant', 'bar', 'cafe', 'tea_room', 'bakery', 'lounge', 'food_court', 'hotel', 'other'
);
create type public.member_role as enum ('owner', 'staff');
create type public.domain_kind as enum ('custom', 'platform');
create type public.prep_station as enum ('kitchen', 'bar', 'none');
create type public.allergen_presence as enum ('contains', 'may_contain');
create type public.order_status as enum (
  'submitted', 'accepted', 'ready', 'served', 'rejected', 'cancelled'
);
create type public.order_source as enum ('qr', 'nfc', 'staff');
create type public.billing_status as enum ('trial', 'active', 'past_due', 'cancelled');
