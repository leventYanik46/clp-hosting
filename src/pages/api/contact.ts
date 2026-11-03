import { createHmac } from 'node:crypto';
import dotenv from 'dotenv';
import { screenContactSubmission, type SpamVerdict } from '~/utils/contactSpam';
export const prerender = false;

const SMTP2GO_SEND_ENDPOINT = 'https://api.smtp2go.com/v3/email/send';

// What happens to a submission the spam screen flags (env CONTACT_SPAM_MODE):
//   reject (default) – refuse it with a polite error; nothing is emailed or sent to the CRM.
//   flag             – email it with a "[Possible spam]" subject and skip the CRM. Useful for tuning.
//   off              – skip screening entirely (kill switch).
type SpamMode = 'reject' | 'flag' | 'off';

const resolveSpamMode = (): SpamMode => {
  const raw = (process.env.CONTACT_SPAM_MODE ?? 'reject').trim().toLowerCase();
  return raw === 'flag' || raw === 'off' ? raw : 'reject';
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseElapsedMs = (value: unknown): number | undefined => {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });

// Display names end up in a mail header; strip anything that could break or forge it.
const headerSafe = (value: string) =>
  value
    .replace(/[\r\n<>"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Shape of SMTP2GO's /v3/email/send reply. A rejected request comes back 4xx with data.error set. */
interface Smtp2goSendResponse {
  request_id?: string;
  data?: {
    succeeded?: number;
    failed?: number;
    failures?: unknown[];
    email_id?: string;
    error?: string;
    error_code?: string;
    field_validation_errors?: unknown;
  };
}

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  sourcePage?: string;
  /** Honeypot input from the form; always empty for real visitors. */
  website?: string;
  /** Milliseconds between form render and submit, measured by the form script. */
  formElapsedMs?: string | number;
  /** The optional SMS consent checkbox ("on" when ticked). */
  smsConsent?: string | boolean;
}

/** The language of the page the form was on, from its path (/tr/..., /es/...); English otherwise. */
const pageLanguage = (sourcePage: string): string => /\/(tr|es)(\/|$)/.exec(sourcePage)?.[1] ?? 'en';

interface CrmLeadOutcome {
  /** True when the CRM recorded the lead; the office then needs no email. */
  recorded: boolean;
  /** Why it was not recorded, one line for the fallback email; empty when it was. */
  note: string;
}

/**
 * What the CRM action answers: NocoBase wraps the result in `data`, a refusal in `errors`. The site is told only
 * that the form was received (never whether the person was already known), plus `unassigned` when the lead was
 * written but nobody owns it, which still needs the office email.
 */
interface CrmLeadReply {
  data?: { status?: string; unassigned?: boolean };
  errors?: Array<{ message?: string }>;
}

const CRM_RECEIVED = 'received';
const CRM_TIMEOUT_MS = 5000;

/** `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<body>")>`: the CRM checks the bytes and the age (5 min). */
const signLead = (secret: string, body: string): string => {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', secret).update(`${t}.`).update(body).digest('hex');
  return `t=${t},v1=${v1}`;
};

/**
 * The CRM (2026-11-03): the submission becomes a New Lead on the sales team's Leads page at once, assigned
 * to the intake owner. It is posted straight to the CRM's inbound hostname (hooks.counselcrm.com): Cloudflare
 * Access lets only this site's service token through, and the body is signed with a shared secret so a wrong
 * caller, a changed byte or a replayed post is refused. Env: CRM_LEADS_URL (https), CRM_LEADS_SECRET,
 * CRM_ACCESS_CLIENT_ID, CRM_ACCESS_CLIENT_SECRET. Unset = not wired on this deploy; the caller falls back to
 * the office email, so a submission is never lost.
 */
const sendLeadToCrm = async (lead: {
  name: string;
  email: string;
  phone: string;
  message: string;
  sourcePage: string;
  smsConsent: boolean;
  lang: string;
}): Promise<CrmLeadOutcome> => {
  const url = process.env.CRM_LEADS_URL ?? '';
  const secret = process.env.CRM_LEADS_SECRET ?? '';
  const clientId = process.env.CRM_ACCESS_CLIENT_ID ?? '';
  const clientSecret = process.env.CRM_ACCESS_CLIENT_SECRET ?? '';
  const missing = [
    ['CRM_LEADS_URL', url],
    ['CRM_LEADS_SECRET', secret],
    ['CRM_ACCESS_CLIENT_ID', clientId],
    ['CRM_ACCESS_CLIENT_SECRET', clientSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    console.error(`[contact] CRM not wired on this deploy (${missing.join(', ')} not set); the lead goes by email`);
    return {
      recorded: false,
      note: 'CRM: not recorded (this site deploy has no CRM connection). Add this lead by hand.',
    };
  }
  if (!url.startsWith('https://')) {
    // The service token would travel in clear text; refuse rather than leak it.
    console.error('[contact] CRM_LEADS_URL must start with https://; the lead goes by email');
    return {
      recorded: false,
      note: 'CRM: not recorded (the CRM address on this site is not https). Add this lead by hand.',
    };
  }
  const body = JSON.stringify(lead);
  try {
    // 5 s: the fallback email must still go out inside the host's function time limit (about 10 s) when the
    // CRM is slow; a lead the CRM recorded after we gave up is caught by the day's dedupe there.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': clientId,
        'CF-Access-Client-Secret': clientSecret,
        'x-clp-signature': signLead(secret, body),
      },
      body,
      signal: AbortSignal.timeout(CRM_TIMEOUT_MS),
    });
    // Read the text first: a timeout while reading or a Cloudflare HTML page must be named as such, not swallowed.
    const raw = await response.text();
    let reply: CrmLeadReply | null = null;
    try {
      reply = JSON.parse(raw) as CrmLeadReply;
    } catch {
      reply = null;
    }
    if (response.ok && reply?.data?.status === CRM_RECEIVED && !reply.data.unassigned) {
      console.log('[contact] CRM recorded the lead');
      return { recorded: true, note: '' };
    }
    if (response.ok && reply?.data?.status === CRM_RECEIVED) {
      console.error('[contact] CRM wrote the lead but could not assign it to anyone');
      return {
        recorded: false,
        note: 'CRM: the lead was written but has no owner. Open the Leads page and assign it.',
      };
    }
    const reason =
      reply?.errors?.[0]?.message ??
      (reply ? 'no outcome in the answer' : `the answer was not JSON: ${raw.slice(0, 120).replace(/\s+/g, ' ')}`);
    console.error('[contact] CRM did not record the lead:', response.status, reason);
    return {
      recorded: false,
      note: `CRM: not recorded (${response.status}${reason ? `: ${reason}` : ''}). Add this lead by hand.`,
    };
  } catch (crmError) {
    const reason =
      crmError instanceof Error && crmError.name === 'TimeoutError'
        ? `the CRM did not answer within ${CRM_TIMEOUT_MS / 1000} seconds`
        : 'the CRM could not be reached';
    console.error(
      '[contact] CRM request failed:',
      crmError instanceof Error ? `${crmError.name}: ${crmError.message}` : crmError
    );
    return { recorded: false, note: `CRM: not recorded (${reason}). Add this lead by hand.` };
  }
};

export async function POST({ request }: { request: Request }) {
  dotenv.config();

  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ error: 'Invalid request body' }, 400);
  }
  const { name, email, phone, message } = payload;
  if ([name, email, phone, message].some((v) => v !== undefined && typeof v !== 'string')) {
    return json({ error: 'Invalid request body' }, 400);
  }
  const sourcePage = typeof payload.sourcePage === 'string' ? payload.sourcePage.trim() : '';
  const resolvedSourcePage = sourcePage || request.headers.get('referer') || 'not clear';

  if (!name || !email || !phone || !message) {
    return json({ error: 'Missing required fields' }, 400);
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }
  if ((phone.match(/\d/g) ?? []).length < 7) {
    return json({ error: 'Please enter a valid phone number.' }, 400);
  }

  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@capitollawpartners.com';
  // What the visitor reads when neither the CRM nor the office email took the message: what did not happen, why, what to do.
  const NOT_SENT = `Your message was not sent: our office mail service did not accept it just now. Please try again in a minute or email us at ${TO_EMAIL}.`;

  // Spam screen. Runs before anything leaves the server so junk never reaches the CRM or the inbox.
  const spamMode = resolveSpamMode();
  const verdict: SpamVerdict =
    spamMode === 'off'
      ? { isSpam: false, reasons: [] }
      : screenContactSubmission({
          name,
          message,
          honeypot: typeof payload.website === 'string' ? payload.website : '',
          elapsedMs: parseElapsedMs(payload.formElapsedMs),
        });

  if (verdict.isSpam) {
    // no name or address in the host's logs: the reasons and the page are enough to tune the screen
    console.warn('[contact] spam screen flagged a submission:', {
      mode: spamMode,
      reasons: verdict.reasons,
      sourcePage: resolvedSourcePage,
    });
    if (spamMode === 'reject') {
      return json({ error: `Your message could not be sent. Please email us directly at ${TO_EMAIL}.` }, 422);
    }
  }

  // 1. The CRM is the record (Levent 2026-11-03: no office email once the lead is on the Leads page).
  //    Flagged submissions stay out of the pipeline and go by email with the [Possible spam] mark.
  const crm: CrmLeadOutcome = verdict.isSpam
    ? { recorded: false, note: '' }
    : await sendLeadToCrm({
        name,
        email,
        phone,
        message,
        sourcePage: resolvedSourcePage,
        smsConsent: payload.smsConsent === 'on' || payload.smsConsent === true || payload.smsConsent === 'true',
        lang: pageLanguage(resolvedSourcePage),
      });
  if (crm.recorded) {
    return json({ success: true });
  }

  // 2. Fallback: the CRM is not wired on this deploy, refused the lead or did not answer, or the submission
  //    is flagged. The office gets the email through SMTP2GO's HTTP API (the same account that sends the CRM
  //    and client portal mail as @capitollawpartners.com; no mailbox or Google account is involved).
  const SMTP2GO_API_KEY = process.env.SMTP2GO_API_KEY;
  // Send-only From address. Must be on a domain verified in SMTP2GO; there is no mailbox behind it.
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'website@capitollawpartners.com';

  if (!SMTP2GO_API_KEY) {
    console.error(
      '[contact] Missing SMTP2GO_API_KEY; a submission was not delivered anywhere:',
      crm.note || 'CRM skipped'
    );
    return json(
      { error: `Your message was not sent: the site's mail service is not set up. Please email us at ${TO_EMAIL}.` },
      500
    );
  }

  const safeName = headerSafe(name) || 'Website visitor';
  const subject = `${verdict.isSpam ? '[Possible spam] ' : ''}New Contact${crm.note ? ' (not in CRM)' : ''}: ${safeName}`;
  const screeningNote = verdict.isSpam ? `Spam screening: ${verdict.reasons.join('; ')}` : '';

  const html = `
    <p>Name: ${escapeHtml(name)}</p>
    <p>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    <p>Phone: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
    <p>Message: ${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    <p>Source page: ${escapeHtml(resolvedSourcePage)}</p>${
      screeningNote ? `\n    <p>${escapeHtml(screeningNote)}</p>` : ''
    }${crm.note ? `\n    <p><strong>${escapeHtml(crm.note)}</strong></p>` : ''}`;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Message: ${message}`,
    `Source page: ${resolvedSourcePage}`,
    ...(screeningNote ? [screeningNote] : []),
    ...(crm.note ? [crm.note] : []),
  ].join('\n');

  try {
    const sendResponse = await fetch(SMTP2GO_SEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': SMTP2GO_API_KEY,
      },
      body: JSON.stringify({
        sender: `${safeName} <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        subject,
        html_body: html,
        text_body: text,
        // The visitor's address passed EMAIL_PATTERN above, so it holds no whitespace or line breaks.
        custom_headers: [{ header: 'Reply-To', value: email.trim() }],
      }),
    });

    // A 200 still has to report at least one accepted recipient.
    const result = (await sendResponse.json().catch(() => null)) as Smtp2goSendResponse | null;
    const accepted = sendResponse.ok && (result?.data?.succeeded ?? 0) > 0;

    if (!accepted) {
      console.error(
        '[contact] SMTP2GO rejected the email; the submission was not delivered anywhere:',
        sendResponse.status,
        result?.data?.error_code ?? '',
        result?.data?.error ?? '',
        result?.data?.field_validation_errors ?? result?.data?.failures ?? '',
        crm.note || 'CRM skipped'
      );
      return json({ error: NOT_SENT }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error(
      '[contact] SMTP2GO request failed; the submission was not delivered anywhere:',
      error,
      crm.note || 'CRM skipped'
    );
    return json({ error: NOT_SENT }, 500);
  }
}
