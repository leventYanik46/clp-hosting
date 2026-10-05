# Handoff: contact-form spam filter (clp-hosting)

Written 2026-10-05 for the next Claude Code session. Branch `main`. **Nothing is committed and nothing is pushed.** Push = live deploy on Netlify; never push without the user's explicit go-ahead.

## Problem

Junk leads arrive through the website contact form (`/api/contact` → Make webhook → Resend email to info@capitollawpartners.com). Three confirmed samples (two on 2026-07-15 at 05:09 and 05:10, one on 2026-09-29), found as forwards in the user's work mailbox (Gmail threads `19f6552613f42385`, `19f65524539790c8`):

| Name | Email | Phone | Message | Source page |
|---|---|---|---|---|
| `nyngTjdJVkQieWDxVupkinG` | `da.t.oz.o.risi.5.9@gmail.com` | 8183097983 | `tGkMGhEghVqmBHsAMKQO` | /contact |
| `FuNiclqwpuDBITlwtidwZQ` | `aq.i.go.p.o.d.a.04@gmail.com` | 8272379773 | `GilwTqXgwVmhoNJcPbP` | /practice-area/immigration-law |
| `xceIjyJFBhPTLAoUHeW` | `aq.i.go.p.o.d.a.04@gmail.com` | 6811268214 | `RVgCcnzJZzElyCOjyWEaViL` | /practice-area/estate-planning |

Fingerprint: random mixed-case letter strings for name and message, Gmail address stuffed with dots, 10-digit phone, same payload sprayed across pages a minute apart. The endpoint previously had no spam checks at all.

## What is in the working tree (uncommitted)

### `src/utils/contactSpam.ts` (new)
Pure scoring module, no dependencies. Spam when score ≥ 3 (`REJECT_SCORE`).

| Rule | Points |
|---|---|
| Honeypot field non-empty | 3 |
| No fill-time field in payload (form script bypassed) | 1 |
| Fill time < 3000 ms | 2 |
| Name looks like random letters | 2 |
| Message looks like random letters | 2 |
| Name and message identical | 1 |
| More than 2 dots in the email local part | 1 |

`looksLikeRandomLetters`: 1–2 words, ASCII letters only, ≥ 8 chars, and either ≥ 3 lower→upper case switches inside a word or zero vowels. Deliberately conservative: no single weak signal rejects; Schwartz, Strzelczyk, VanDerBerg, McDonald, accented names all pass.

### `src/pages/api/contact.ts` (modified)
Note: this file was **already uncommitted** before this session (the Gmail→Resend migration; the `package.json` / `package-lock.json` changes removing `googleapis` and `nodemailer` belong to that same migration). This session added on top:
- Email format check and phone check (≥ 7 digits) → 400.
- Screening runs before the Make webhook and before Resend, so flagged junk never reaches either.
- `CONTACT_SPAM_MODE` env var: `reject` (default; returns 422 with "Your message could not be sent. Please email us directly at <CONTACT_TO_EMAIL>."), `flag` (emails it with a "[Possible spam]" subject plus a "Spam screening: score … (reasons)" line, skips Make, returns success), `off` (kill switch).
- Flagged submissions are logged with `console.warn('[contact] spam screen flagged a submission:', {...})` including score, reasons, name, email, source page. Visible in Netlify function logs.
- Reads `website` (honeypot) and `formElapsedMs` from the JSON payload.
- Rejections are deliberately loud (422 + message), not silent, so a misclassified human is told to email directly instead of losing the lead.

### `src/components/ui/Form.astro` (modified)
- Honeypot `<input type="text" name="website" id="website-field" tabindex="-1" autocomplete="off">` inside an `aria-hidden="true"` wrapper positioned at `left:-10000px`, inserted right after the opening `<form>` tag.
- Inline script: stores `data-contact-form-started-at` when the form is bound (page load and `astro:after-swap`), writes `data-contact-form-elapsed-ms` in the submit handler (before the 2 s GA delay), and adds `formElapsedMs` to the JSON payload in `sendContactForm`.
- Prettier was NOT run on this file: it was already non-conforming at HEAD and a full reformat would bury the real diff. Only `contact.ts` and `contactSpam.ts` were formatted.

## Verification already done

- Rule check script (scratchpad, ephemeral) with the 3 real samples, the same samples as direct POSTs (no timing/honeypot), and as headless-browser submissions (honeypot filled, 420 ms), plus 8 legitimate edge cases (tricky surnames, Turkish/Spanish/Polish names, 2500 ms autofill power user, a pre-deploy page with no timing field, name==message "test"). All junk scored 6–10, all legit scored 0–2. Re-create by importing `screenContactSubmission` and running `node --experimental-strip-types`.
- `npx astro check`: 0 errors in touched files (65 pre-existing errors elsewhere in the project). `npx eslint` clean. `npx prettier --check` clean for the two TS files.
- Dev server smoke test (`npx astro dev --port 4399`, no `.env` locally):
  - real junk sample → 422 with the polite message
  - realistic fields + honeypot filled → 422
  - legitimate, with or without `formElapsedMs` → reaches the Resend step (500 "Email service is not configured" only because no local env), i.e. passed screening
  - bad email / bad phone → 400
  - rendered `/contact` contains the honeypot and the new script lines
- Real browser (Claude in Chrome, localhost:4399/contact): honeypot is off-screen (x ≈ -9400), inside aria-hidden, tabindex -1, autocomplete off; `startedAt` set; the payload the real form sent contained `"website": ""` and a populated `formElapsedMs`.
- A final screenshot step was declined by the user; it was cosmetic only.

## Still to do

1. **Rollout mode.** With no env change the default `reject` is live on deploy. Safer first step: set `CONTACT_SPAM_MODE=flag` in Netlify (Site settings → Environment variables, then redeploy) for a week or two, watch for "[Possible spam]" mails that are actually real people, then remove the var to switch to `reject`.
2. **Commit** (user's call on split): the Resend migration (`package.json`, `package-lock.json`, Resend parts of `contact.ts`) and the spam filter (`contactSpam.ts`, filter parts of `contact.ts`, `Form.astro`) can be one commit or two. Do not commit this handoff file.
3. **Do not push** without the user's explicit go-ahead.
4. After deploy: check Netlify function logs for `[contact] spam screen flagged` and confirm the Make scenario still receives normal leads (payload to Make is unchanged).
5. If junk continues or the bot adapts (lowercase strings, real-looking names): add Cloudflare Turnstile (needs `PUBLIC_TURNSTILE_SITE_KEY` baked into the static page and `TURNSTILE_SECRET_KEY` on the endpoint). Not implemented. A URL-count rule for link spam would also be cheap to add in `contactSpam.ts`.
6. `netlify env:list` was blocked by the permission classifier in this session; env var names must be checked in the Netlify UI by the user. The Netlify CLI is logged in and linked to project `clp-hosting`.

## Quick re-test commands

```bash
npx astro dev --port 4399
# junk → expect 422
curl -s -X POST localhost:4399/api/contact -H 'Content-Type: application/json' \
  -d '{"name":"nyngTjdJVkQieWDxVupkinG","email":"da.t.oz.o.risi.5.9@gmail.com","phone":"8183097983","message":"tGkMGhEghVqmBHsAMKQO"}'
# legit → expect 500 "Email service is not configured" locally (passed screening)
curl -s -X POST localhost:4399/api/contact -H 'Content-Type: application/json' \
  -d '{"name":"John Schwartz","email":"john.schwartz@gmail.com","phone":"2025550148","message":"I need help with an H-1B transfer.","website":"","formElapsedMs":41000}'
```
