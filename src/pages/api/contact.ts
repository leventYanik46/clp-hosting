import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
export const prerender = false;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function POST({ request }: { request: Request }) {
  dotenv.config();

  let payload: { name?: string; email?: string; phone?: string; message?: string; sourcePage?: string };
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

  // 1. Send to Make webhook first — if this fails the user can safely retry (no email sent yet)
  const WEBHOOK_URL = process.env.PUBLIC_MAKE_WEBHOOK_URL ?? '';
  console.log('[contact] WEBHOOK_URL set:', Boolean(WEBHOOK_URL));

  if (WEBHOOK_URL) {
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

  // 2. Send confirmation email via Gmail OAuth2
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const SENDER_EMAIL = process.env.GOOGLE_EMAIL;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !SENDER_EMAIL) {
    console.error('[contact] Missing OAuth2 credentials');
    return json({ error: 'Missing OAuth2 credentials' }, 500);
  }

  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  try {
    const accessToken = await oAuth2Client.getAccessToken();
    if (!accessToken.token) {
      throw new Error('Failed to retrieve access token.');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      secure: true,
      auth: {
        type: 'OAuth2',
        user: SENDER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: `${name} <${SENDER_EMAIL}>`,
      to: 'info@capitollawpartners.com',
      replyTo: email,
      subject: `New Contact: ${name}`,
      html: `
        <p>Name: ${name}</p>
        <p>Email: <a href="mailto:${email}">${email}</a></p>
        <p>Phone: <a href="tel:${phone}">${phone}</a></p>
        <p>Message: ${message}</p>
        <p>Source page: ${resolvedSourcePage}</p>`,
    };

    await transporter.sendMail(mailOptions);
    return json({ success: true, mail: mailOptions });
  } catch (error) {
    console.error('[contact] Nodemailer failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed to send email' }, 500);
  }
}
