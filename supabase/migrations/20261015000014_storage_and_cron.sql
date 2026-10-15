-- Storage bucket and scheduled jobs. Bible: vol. 04 §12, §13; vol. 03 §8, §9.

-- Public read bucket (logos and photos are meant to be public). No write policy for anon or
-- authenticated: only the server (secret key) writes, after checking the owner role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-media', 'shop-media', true, 5242880, array['image/webp'])
on conflict (id) do nothing;

create extension if not exists pg_cron with schema pg_catalog;

-- Purge client identifiers after 48 h (no personal data kept).
select cron.schedule('purge-client-keys', '7 * * * *', $$
  update public.orders set client_key_hash = null
  where client_key_hash is not null and created_at < now() - interval '48 hours';
$$);

-- Expired staff sessions: revoke, then delete after 90 days.
select cron.schedule('expire-staff-sessions', '17 * * * *', $$
  update public.staff_sessions set revoked_at = now(), revoked_reason = 'expired'
  where revoked_at is null and expires_at < now();
  delete from public.staff_sessions where created_at < now() - interval '90 days';
$$);

-- Audit log retention: 24 months.
select cron.schedule('purge-audit-log', '27 3 * * *', $$
  delete from public.audit_log where created_at < now() - interval '24 months';
$$);
