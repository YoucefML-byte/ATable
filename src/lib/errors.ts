// Single correspondence table: business code → French message key → HTTP status (vol. 04 §9).
// The French texts themselves live in messages/fr.json under "errors.<CODE>".

export const ERROR_CODES = {
  // Customer order
  EMPTY_ORDER: 400,
  BAD_CLIENT: 400,
  BAD_SOURCE: 400,
  NOTE_TOO_LONG: 400,
  SHOP_UNAVAILABLE: 503,
  ORDERS_CLOSED: 409,
  INVALID_TABLE: 404,
  TOO_MANY_LINES: 400,
  BAD_QUANTITY: 400,
  ORDER_TOO_LARGE: 400,
  RATE_LIMITED: 429,
  TOO_MANY_PENDING: 429,
  TABLE_CLOSED: 409,
  PRODUCT_UNAVAILABLE: 409,
  OPTIONS_INVALID: 409,
  // Staff / owner
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  TABLE_HAS_PENDING_ORDERS: 409,
  CATEGORY_NOT_EMPTY: 409,
  LAST_MENU: 409,
  CROSS_SHOP_LINK: 400,
  SLUG_TAKEN: 409,
  LABEL_TAKEN: 409,
  DOMAIN_TAKEN: 409,
  EMAIL_TAKEN: 409,
  CONTRAST_TOO_LOW: 400,
  // Application
  BAD_REQUEST: 400,
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  MFA_REQUIRED: 401,
  DEVICE_NOT_ENROLLED: 403,
  DEVICE_LOCKED: 423,
  MEMBER_LOCKED: 423,
  BAD_CREDENTIALS: 401,
  BAD_PIN: 401,
  WEAK_PIN: 400,
  BAD_ORIGIN: 403,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_FILE: 415,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.hasOwn(ERROR_CODES, value);
}

export function httpStatusFor(code: ErrorCode): number {
  return ERROR_CODES[code];
}

/** Translation key of the French message for a code. */
export function messageKeyFor(code: ErrorCode): `errors.${ErrorCode}` {
  return `errors.${code}`;
}

export type DbErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
};

export type MappedDbError = { code: ErrorCode; detail: string | null };

/**
 * Converts a PostgreSQL/PostgREST error into a business code.
 * Business errors are raised with errcode P0001 and the code as message; anything else is INTERNAL.
 */
export function mapDbError(error: DbErrorLike): MappedDbError {
  if (error.code === 'P0001' && isErrorCode(error.message)) {
    return { code: error.message, detail: error.details ?? null };
  }
  // invalid_text_representation (e.g. a malformed uuid) → bad request
  if (error.code === '22P02') return { code: 'BAD_REQUEST', detail: null };
  // insufficient_privilege: RLS / grants refused the operation
  if (error.code === '42501') return { code: 'FORBIDDEN', detail: null };
  return { code: 'INTERNAL', detail: null };
}

/** INVALID_TRANSITION carries "currentStatus|actorName" (ADR-009). */
export function parseTransitionDetail(detail: string | null): {
  status: string;
  actor: string | null;
} {
  const [status = '', actor = ''] = (detail ?? '').split('|');
  return { status, actor: actor.length > 0 ? actor : null };
}
