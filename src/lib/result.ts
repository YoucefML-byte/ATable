// Typed results: actions and queries never throw for expected business errors (vol. 06 §4).
import type { ErrorCode } from './errors';

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; code: ErrorCode; message: string; fields?: Record<string, string> };
export type Result<T> = Ok<T> | Err;
export type ActionResult<T = null> = Result<T>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err(code: ErrorCode, message: string, fields?: Record<string, string>): Err {
  return fields ? { ok: false, code, message, fields } : { ok: false, code, message };
}
