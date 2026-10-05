import dotenv from 'dotenv';
import { screenContactSubmission, type SpamVerdict } from '~/utils/contactSpam';
export const prerender = false;

const SMTP2GO_SEND_ENDPOINT = 'https://api.smtp2go.com/v3/email/send';

// What happens to a submission the spam screen flags (env CONTACT_SPAM_MODE):
//   reject (default) – refuse it with a polite error; nothing is emailed or sent to Make.
//   flag             – email it with a "[Possible spam]" subject and skip Make. Useful for tuning.
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
}

export async function POST({ request }: { request: Request }) {
  dotenv.config();

  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { name, email, phone, message } = payload;
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

  // Spam screen. Runs before anything leaves the server so junk never reaches Make or the inbox.
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
    console.warn('[contact] spam screen flagged a submission:', {
      mode: spamMode,
      reasons: verdict.reasons,
      name,
      email,
      sourcePage: resolvedSourcePage,
    });
    if (spamMode === 'reject') {
      return json({ error: `Your message could not be sent. Please email us directly at ${TO_EMAIL}.` }, 422);
    }
  }

  // 1. Send to Make webhook first, if this fails the user can safely retry (no email sent yet).
  //    Flagged submissions skip Make so the lead pipeline stays clean.
  const WEBHOOK_URL = process.env.PUBLIC_MAKE_WEBHOOK_URL ?? '';
  console.log('[contact] WEBHOOK_URL set:', Boolean(WEBHOOK_URL));

  if (WEBHOOK_URL && !verdict.isSpam) {
    try {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, sourcePage: resolvedSourcePage }),
      });
      console.log('[contact] webhook status:', webhookResponse.status);
      if (!webhookResponse.ok) {
        return json({ error: `Webhook rejected the request (${webhookResponse.status}). Please try again.` }, 500);
      }
    } catch (webhookError) {
      console.error('[contact] Webhook fetch failed:', webhookError);
      return json({ error: 'Could not reach the lead tracking service. Please try again.' }, 500);
    }
  }

  // 2. Notify the firm through SMTP2GO's HTTP API. The same SMTP2GO account already sends the CRM
  //    and portal mail as @capitollawpartners.com; no mailbox or Google account is involved.
  const SMTP2GO_API_KEY = process.env.SMTP2GO_API_KEY;
  // Send-only From address. Must be on a domain verified in SMTP2GO; there is no mailbox behind it.
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'website@capitollawpartners.com';

  if (!SMTP2GO_API_KEY) {
    console.error('[contact] Missing SMTP2GO_API_KEY');
    return json({ error: 'Email service is not configured' }, 500);
  }

  const safeName = headerSafe(name) || 'Website visitor';
  const subject = `${verdict.isSpam ? '[Possible spam] ' : ''}New Contact: ${safeName}`;
  const screeningNote = verdict.isSpam ? `Spam screening: ${verdict.reasons.join('; ')}` : '';

  const html = `
    <p>Name: ${escapeHtml(name)}</p>
    <p>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    <p>Phone: <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
    <p>Message: ${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    <p>Source page: ${escapeHtml(resolvedSourcePage)}</p>${
      screeningNote ? `\n    <p>${escapeHtml(screeningNote)}</p>` : ''
    }`;

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Message: ${message}`,
    `Source page: ${resolvedSourcePage}`,
    ...(screeningNote ? [screeningNote] : []),
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
        '[contact] SMTP2GO rejected the email:',
        sendResponse.status,
        result?.data?.error_code ?? '',
        result?.data?.error ?? '',
        result?.data?.field_validation_errors ?? result?.data?.failures ?? ''
      );
      return json({ error: 'Failed to send email. Please try again.' }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('[contact] SMTP2GO request failed:', error);
    return json({ error: 'Failed to send email. Please try again.' }, 500);
  }
}
