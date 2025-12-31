import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
export const prerender = false;

const SHEETS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];

const appendContactRow = async (row: Array<string>) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const sheetName = process.env.GOOGLE_SHEETS_NAME || 'Sheet1';

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Missing Google Sheets credentials');
  }

  const auth = new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey.replace(/\\n/g, '\n'),
    SHEETS_SCOPE
  );

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
};

export async function POST({ request }) {
  dotenv.config();
  const payload = await request.json();
  const { name, email, phone, message } = payload;
  const language = typeof payload.language === 'string' ? payload.language : '';
  const sourcePage = typeof payload.sourcePage === 'string' ? payload.sourcePage : '';
  const resolvedSourcePage = sourcePage || request.headers.get('referer') || '';

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
        <p>Email: <a href="mailto:${email}">${email}</a></p>
        <p>Phone: <a href="tel:${phone}">${phone}</a></p>
        <hr/><p>${message}</p>`
    };
    await transporter.sendMail(mailOptions);
    let sheetLogged = false;

    try {
      await appendContactRow([
        new Date().toISOString(),
        String(name),
        String(email),
        String(phone),
        String(message),
        language,
        resolvedSourcePage,
        'No',
      ]);
      sheetLogged = true;
    } catch (sheetError) {
      console.error('Google Sheets logging failed', sheetError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mail: mailOptions,
        sheetLogged,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Nodemailer failed to send mail', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
