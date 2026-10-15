import 'server-only';
import { env } from '@/server/env';
import { logger } from '@/lib/logger';

// Custom domains of shops (CON-03), through the Vercel REST API. Without a token (local, staging
// without a domain), the domain is only recorded and must be added by hand (docs/HUMAN-TODO.md).

export type DomainState = {
  configured: boolean;
  verified: boolean;
  instructions: Array<{ type: string; name: string; value: string }>;
};

function api(path: string): string | null {
  if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) return null;
  const team = env.VERCEL_TEAM_ID
    ? `${path.includes('?') ? '&' : '?'}teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}`
    : '';
  return `https://api.vercel.com${path.replace(':project', encodeURIComponent(env.VERCEL_PROJECT_ID))}${team}`;
}

async function call(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const url = api(path);
  if (!url) return { ok: false, status: 0, data: {} };
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok && res.status !== 404)
    logger.warn({ event: 'vercel.api_error', status: res.status, path });
  return { ok: res.ok, status: res.status, data };
}

export const vercelEnabled = () => api('/') !== null;

export async function addProjectDomain(hostname: string): Promise<DomainState | null> {
  const res = await call('POST', '/v10/projects/:project/domains', { name: hostname });
  if (!res.ok && res.status !== 409) return null;
  return getProjectDomain(hostname);
}

export async function getProjectDomain(hostname: string): Promise<DomainState | null> {
  const res = await call('GET', `/v9/projects/:project/domains/${encodeURIComponent(hostname)}`);
  if (!res.ok) return null;
  const config = await call('GET', `/v6/domains/${encodeURIComponent(hostname)}/config`);
  const verification = Array.isArray(res.data.verification)
    ? (res.data.verification as Array<{ type: string; domain: string; value: string }>)
    : [];
  const instructions = verification.map((v) => ({ type: v.type, name: v.domain, value: v.value }));
  const apex = hostname.split('.').length === 2;
  if (config.data.misconfigured !== false) {
    instructions.push(
      apex
        ? { type: 'A', name: hostname, value: '76.76.21.21' }
        : { type: 'CNAME', name: hostname, value: 'cname.vercel-dns.com' },
    );
  }
  return {
    configured: config.data.misconfigured === false,
    verified: res.data.verified === true,
    instructions,
  };
}

export async function removeProjectDomain(hostname: string): Promise<boolean> {
  const res = await call('DELETE', `/v9/projects/:project/domains/${encodeURIComponent(hostname)}`);
  return res.ok || res.status === 404;
}
