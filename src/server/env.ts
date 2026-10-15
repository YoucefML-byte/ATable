import 'server-only';
import { z } from 'zod';

// Environment variables validated at startup (vol. 03 §11). The app refuses to start without them.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  SUPABASE_SECRET_KEY: z.string().min(20),
  PLATFORM_ROOT_DOMAIN: z.string().regex(/^[a-z0-9.-]+$/),
  PLATFORM_PRO_HOST: z.string().regex(/^[a-z0-9.:-]+$/),
  PLATFORM_CONSOLE_HOST: z.string().regex(/^[a-z0-9.:-]+$/),
  STAFF_EMAIL_DOMAIN: z
    .string()
    .regex(/^[a-z0-9.-]+$/)
    .default('staff.atable.invalid'),
  CRON_SECRET: z.string().min(16).optional(),
  VERCEL_API_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  /** Public base URL of the storage CDN (defaults to the Supabase URL). */
  STORAGE_PUBLIC_URL: z.url().optional(),
  /** Scheme used to build absolute links (QR codes, emails): https in production. */
  PUBLIC_SCHEME: z.enum(['http', 'https']).default('https'),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  // Empty values (KEY=) count as missing.
  const values = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ''),
  );
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${missing}. See .env.example.`);
  }
  return parsed.data;
}

export const env: Env = load();

/** Absolute URL on a host, e.g. url('pro.atable.fr', '/connexion'). */
export function absoluteUrl(host: string, path: string): string {
  return `${env.PUBLIC_SCHEME}://${host}${path}`;
}

/** Hosts without the port, used to recognise the platform spaces. */
export function bareHost(host: string): string {
  return host.split(':')[0] ?? host;
}

/**
 * Public URL on a shop domain (QR codes, NFC). Locally the shop domains share the port of the pro
 * space (bistrot.localhost:3000); in production there is no port.
 */
export function shopPublicUrl(hostname: string, path: string): string {
  const port = env.PLATFORM_PRO_HOST.split(':')[1];
  return absoluteUrl(port ? `${hostname}:${port}` : hostname, path);
}
