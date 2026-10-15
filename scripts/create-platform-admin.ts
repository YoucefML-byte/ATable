// Creates (or promotes) a platform administrator. Run once per person, from a trusted machine:
//   pnpm admin:create prenom.nom@exemple.fr
// The person receives a link to choose a password, then enrols an authenticator app at the first
// console login (2FA is mandatory for the console, vol. 05 §4).
import { createClient } from '@supabase/supabase-js';

const email = (process.argv[2] ?? '').trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const consoleHost = process.env.PLATFORM_CONSOLE_HOST;
const scheme = process.env.PUBLIC_SCHEME ?? 'https';

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Usage: pnpm admin:create <email>');
  process.exit(1);
}
if (!url || !secret || !consoleHost) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY or PLATFORM_CONSOLE_HOST.');
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const redirectTo = `${scheme}://${consoleHost}/auth/confirm`;

const { data: existing } = await admin.rpc('auth_user_id_by_email', { p_email: email });
let userId = typeof existing === 'string' ? existing : null;
if (userId) {
  console.log(`Existing account found for ${email}: promoting it.`);
} else {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error || !data.user) {
    console.error(`Invitation failed: ${error?.message ?? 'unknown error'}`);
    process.exit(1);
  }
  userId = data.user.id;
  console.log(`Invitation sent to ${email}.`);
}
const { error } = await admin.from('platform_admins').upsert({ user_id: userId });
if (error) {
  console.error(`Could not grant the platform role: ${error.message}`);
  process.exit(1);
}
await admin
  .from('audit_log')
  .insert({
    shop_id: null,
    actor_kind: 'system',
    action: 'platform_admin.grant',
    entity_type: 'user',
    entity_id: userId,
  });
console.log(
  `${email} is now a platform administrator. Console: ${scheme}://${consoleHost}/connexion`,
);
