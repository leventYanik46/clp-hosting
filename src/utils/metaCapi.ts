import { createHash, randomUUID } from 'node:crypto';

/**
 * Meta Conversions API for the contact form: one server-side `Lead` per submission, carrying the same event id as
 * the browser Pixel's Lead (Meta keeps one of the two) and the identity keys the CRM later attaches to its stage
 * events (contract: docs/meta-crm-contract.md). Env: META_CAPI_ACCESS_TOKEN (dataset token, Netlify only),
 * META_CAPI_TEST_EVENT_CODE (optional; routes events to the Test events tab). The pixel id comes from
 * src/config.yaml. Nothing here throws: a Meta failure never costs a lead.
 */

const GRAPH_VERSION = 'v27.0';
const META_TIMEOUT_MS = 3000;

/** What the CRM accepts as submissionId; the browser sends a UUID, which fits. */
export const META_EVENT_ID_PATTERN = /^[A-Za-z0-9_.-]{6,64}$/;

export const newEventId = (): string => randomUUID();

// Hashing, identical on the site and in the CRM (Meta's customer-information spec): normalise, then SHA-256 hex.
export const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
/** Digits only; a bare 10-digit number is read as US and gets the country code. */
export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `1${digits}` : digits;
};
/** Lowercase, punctuation stripped, single spaces. */
export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
/** The form has one name field: first word is the first name, the rest the last name. */
export const splitName = (fullName: string): { fn: string; ln: string } => {
  const name = normalizeName(fullName);
  const space = name.indexOf(' ');
  return space === -1 ? { fn: name, ln: '' } : { fn: name.slice(0, space), ln: name.slice(space + 1) };
};

const TOUCH_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'] as const;
type TouchKey = (typeof TOUCH_KEYS)[number];
type Touch = Partial<Record<TouchKey, string>>;

/** The identity keys sent to Meta with the Lead and to the CRM as `meta` (all optional but eventId and sourcePage). */
export type MetaIdentity = Touch & {
  eventId: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
  sourcePage: string;
};

const MAX_VALUE_LENGTH = 300;
const cleanValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_VALUE_LENGTH || /\s/.test(trimmed)) return undefined;
  return trimmed;
};

/** The first-touch object the form sends (sessionStorage, written by MetaPixel.astro); unknown keys dropped. */
export const readTouch = (raw: unknown): Touch => {
  const touch: Touch = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return touch;
  for (const key of TOUCH_KEYS) {
    const value = cleanValue((raw as Record<string, unknown>)[key]);
    if (value) touch[key] = value;
  }
  return touch;
};

const parseCookies = (header: string | null): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
};

const queryParam = (url: string, key: string): string | undefined => {
  try {
    return cleanValue(new URL(url).searchParams.get(key));
  } catch {
    return undefined;
  }
};

/**
 * Gather everything Meta can match on, from the request (cookies, user agent, IP), the first-touch object and the
 * page URL. `_fbc` is built from `fbclid` when the cookie is missing (Meta's documented fallback).
 */
export const collectMetaIdentity = (input: {
  eventId: string;
  request: Request;
  clientIp: string;
  sourcePage: string;
  touch: unknown;
}): MetaIdentity => {
  const cookies = parseCookies(input.request.headers.get('cookie'));
  const touch = readTouch(input.touch);
  const fbclid = touch.fbclid ?? queryParam(input.sourcePage, 'fbclid');
  const fbp = cleanValue(cookies._fbp);
  const fbc = cleanValue(cookies._fbc) ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
  const identity: MetaIdentity = { eventId: input.eventId, sourcePage: input.sourcePage };
  if (fbp) identity.fbp = fbp;
  if (fbc) identity.fbc = fbc;
  if (fbclid) identity.fbclid = fbclid;
  const clientIp = cleanValue(input.clientIp);
  if (clientIp) identity.clientIp = clientIp;
  const userAgent = input.request.headers.get('user-agent')?.trim();
  if (userAgent) identity.userAgent = userAgent.slice(0, 500);
  for (const key of TOUCH_KEYS) {
    if (key === 'fbclid') continue;
    const value = touch[key] ?? queryParam(input.sourcePage, key);
    if (value) identity[key] = value;
  }
  return identity;
};

interface MetaEventsReply {
  events_received?: number;
  fbtrace_id?: string;
  error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
}

/**
 * POST one `Lead` to the dataset. Resolves in all cases; the outcome goes to the function log without any
 * personal data. Skips with a warning when the deploy has no token, so the form keeps working.
 */
export const sendMetaLeadEvent = async (input: {
  pixelId: string | undefined;
  identity: MetaIdentity;
  email: string;
  phone: string;
  name: string;
}): Promise<void> => {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (!input.pixelId || !token) {
    console.warn('[contact] meta capi: not wired on this deploy (pixel id or META_CAPI_ACCESS_TOKEN missing)');
    return;
  }

  const { fn, ln } = splitName(input.name);
  const userData: Record<string, string | string[]> = {
    em: [sha256(normalizeEmail(input.email))],
    ph: [sha256(normalizePhone(input.phone))],
  };
  if (fn) userData.fn = [sha256(fn)];
  if (ln) userData.ln = [sha256(ln)];
  const { identity } = input;
  if (identity.clientIp) userData.client_ip_address = identity.clientIp;
  if (identity.userAgent) userData.client_user_agent = identity.userAgent;
  if (identity.fbp) userData.fbp = identity.fbp;
  if (identity.fbc) userData.fbc = identity.fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: identity.eventId,
        action_source: 'website',
        event_source_url: identity.sourcePage,
        user_data: userData,
      },
    ],
    // In the body rather than the query string, so the token never lands in a request log.
    access_token: token,
  };
  if (testEventCode) body.test_event_code = testEventCode;

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${input.pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    });
    const reply = (await response.json().catch(() => null)) as MetaEventsReply | null;
    if (response.ok && (reply?.events_received ?? 0) > 0) {
      console.log('[contact] meta capi: Lead received', {
        eventId: identity.eventId,
        fbtrace_id: reply?.fbtrace_id,
        test: !!testEventCode,
      });
      return;
    }
    console.error('[contact] meta capi: Lead not received', {
      status: response.status,
      code: reply?.error?.code,
      subcode: reply?.error?.error_subcode,
      message: reply?.error?.message,
      fbtrace_id: reply?.error?.fbtrace_id ?? reply?.fbtrace_id,
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'TimeoutError'
        ? `no answer within ${META_TIMEOUT_MS / 1000} s`
        : error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
    console.error('[contact] meta capi: request failed:', reason);
  }
};
