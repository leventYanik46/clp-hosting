import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
export const prerender = false;

export async function POST({ request }) {
  dotenv.config();
  const payload = await request.json();
  const { name, email, phone, message } = payload;
  const sourcePage = typeof payload.sourcePage === 'string' ? payload.sourcePage.trim() : '';
  const resolvedSourcePage = sourcePage || request.headers.get('referer') || 'not clear';

  // Validate required fields
  if (!name || !email || !phone || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  // OAuth2 Credentials (Set these in your environment variables)
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const SENDER_EMAIL = process.env.GOOGLE_EMAIL; // Your Gmail account

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !SENDER_EMAIL) {
    return new Response(JSON.stringify({ error: 'Missing OAuth2 credentials' }), { status: 500 });
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
      secure: true, // `true` for port 465, `false` for port 587
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
      to: "info@capitollawpartners.com",
      replyTo: email,
      subject: `New Contact: ${name}`,
      html: `
        <p>Name: ${name}</p>
        <p>Email: <a href="mailto:${email}">${email}</a></p>
        <p>Phone: <a href="tel:${phone}">${phone}</a></p>
        <p>Message: ${message}</p>
        <p>Source page: ${resolvedSourcePage}</p> `
        
    };
    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({
        success: true,
        mail: mailOptions,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Nodemailer failed to send mail', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
