// Structured logger. Never log a PIN, password, session token, cookie, full table token,
// client key or .env content (vol. 05 §9, vol. 06 §8).

type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /pin|password|secret|token|cookie|authorization|client_?key|api_?key/i;

function minLevel(): number {
  const configured = (process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')) as Level;
  return LEVELS[configured] ?? LEVELS.info;
}

/** Masks sensitive fields; table tokens keep their first 4 characters only. */
export function redact(fields: Fields): Fields {
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (/table_?token/i.test(key) && typeof value === 'string') {
      out[key] = `${value.slice(0, 4)}…`;
    } else if (SENSITIVE_KEY.test(key)) {
      out[key] = '[redacted]';
    } else if (value instanceof Error) {
      out[key] = { name: value.name, message: value.message };
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Removes table tokens from URLs: /t/<token> → /t/[redacted]. */
export function redactUrl(url: string): string {
  return url.replace(/\/t\/[A-Za-z0-9_-]+/g, '/t/[redacted]');
}

function write(level: Level, fields: Fields): void {
  if (LEVELS[level] < minLevel()) return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), ...redact(fields) });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (fields: Fields) => write('debug', fields),
  info: (fields: Fields) => write('info', fields),
  warn: (fields: Fields) => write('warn', fields),
  error: (fields: Fields) => write('error', fields),
};
