# Meta dataset: site and Counsel CRM contract

Agreed 2026-11-10 between the website (this repo) and the Counsel CRM (NocoBase) integration. One Meta dataset,
`1667395125103753`, two senders. Change this file when either side changes what it sends.

## Tokens

- Two dataset access tokens on the same dataset: one for the site (Netlify env `META_CAPI_ACCESS_TOKEN`, never in
  the repo), one named "Counsel CRM" for NocoBase. Neither side sees the other's token.
- Graph API: the site posts `v27.0`; the CRM posts `v25.0` until `META_GRAPH_VERSION` is set on its side. Both hit
  `/<dataset>/events`.

## Who sends which event

| Sender                       | event_name                                                                                                                                                | action_source    | custom_data                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------- |
| Browser Pixel (every page)   | `PageView`, `Contact` (phone / WhatsApp clicks)                                                                                                           | website          | –                                                           |
| Browser Pixel (form success) | `Lead` with `eventID`                                                                                                                                     | website          | –                                                           |
| Site server (`/api/contact`) | `Lead` with the same `event_id` (Meta dedups the pair)                                                                                                    | website          | –                                                           |
| CRM, one per status change   | `NewLead`, `AttemptedToContact`, `NoAnswer`, `Connected`, `LongTermFollowUp`, `InProgress`, `OpenDeal`, `ActiveClient`, `Unqualified`, `NotMovingForward` | system_generated | `{ event_source: "crm", lead_event_source: "Counsel CRM" }` |

The CRM never sends `Lead`. CRM event ids are `crm:<contact>:<stage>:<ms>`, fresh per change.

## The webform post (site → CRM)

Endpoint, headers and `x-clp-signature` unchanged. Two keys added to the JSON body:

```json
{
  "name": "…",
  "email": "…",
  "phone": "…",
  "message": "…",
  "sourcePage": "…",
  "smsConsent": false,
  "lang": "en",
  "submissionId": "<eventId>",
  "meta": {
    "eventId": "<same UUID as the browser and server Lead; [A-Za-z0-9_.-], 6-64 chars>",
    "fbp": "<_fbp cookie>",
    "fbc": "<_fbc cookie, or fb.1.<ms>.<fbclid> when the cookie is missing>",
    "fbclid": "…",
    "clientIp": "<visitor IP from clientAddress>",
    "userAgent": "<request header>",
    "sourcePage": "<page the form was on>",
    "utm_source": "…",
    "utm_medium": "…",
    "utm_campaign": "…",
    "utm_term": "…",
    "utm_content": "…"
  }
}
```

All `meta` values are optional strings. `submissionId` equals `meta.eventId`; if it were missing the CRM would use
`meta.eventId` as its dedupe id (`web:<eventId>`) anyway. A `meta` member that fails the CRM's shape check is dropped
silently and the lead still lands. `utm_*` and `fbclid` are first-touch: captured on the first page of the
visit (`MetaPixel.astro`, sessionStorage `clp_touch`), falling back to the query string of `sourcePage`. The CRM
stores all of them on the lead and attaches them to every stage event so Meta ties the site's `Lead` and the CRM's
stage events to one person.

## Hashing (identical on both sides, Meta's spec)

- email: trim, lowercase
- phone: digits only; prefix `1` when exactly 10 digits
- names: lowercase, punctuation stripped, split on the first space when only a full name exists
- SHA-256, hex. Code: `src/utils/metaCapi.ts`.
- The CRM also sends `external_id` (hashed CRM contact id) and `country` (hashed `us`).

## Instant Form leads

Created inside Facebook/Instagram; the CRM holds Meta's `lead_id` and sends it with stage events as a bare integer.
Nothing needed from the site.

## After both halves are live

Events Manager → map the CRM stage events for Conversion Leads optimisation so campaigns learn from qualified
leads, not raw ones. Remove `META_CAPI_TEST_EVENT_CODE` from Netlify once the Test events tab shows the pair of
`Lead` events deduplicated.
