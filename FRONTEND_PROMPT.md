# Frontend build prompt — Email Campaign Platform

> Paste everything below the line into your AI coding assistant (or hand it to a
> frontend developer). It is self-contained: it describes the product, the API
> contract, the screens, the rules and the edge cases. Source of truth for the API is
> [README.md](./README.md); mail internals are in [EMAIL_FLOW.md](./EMAIL_FLOW.md) and
> [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Your task

Build the web UI for a **B2B email outreach tool for chemical sellers**. A sales user
picks a chemical and an offer price, selects customers, chooses email templates,
optionally personalizes the email per customer, and sends the campaign. Customer
replies are captured from the seller's own Gmail/Workspace inbox into the backend.

The backend already exists (Spring Boot REST API). You are building **only the
frontend**. Do not invent endpoints: use only those listed in section 5. Where the
backend lacks something the UI needs, follow section 9 (known gaps) instead of
guessing.

Suggested stack (change if your team has a standard): React + TypeScript, Vite,
TanStack Query for server state, React Hook Form + Zod for forms, a component library
such as shadcn/ui or MUI, and a typed API client. Keep API types in one file.

## 2. Architecture rules (non-negotiable)

1. **The browser never calls the email service directly and never holds the API key.**
   This service has no login. The parent platform (ChemOS) authenticates the user, and
   *ChemOS's backend* calls this service server-to-server, adding these headers:

   | Header | Meaning |
   |---|---|
   | `X-API-Key` | shared secret; missing/wrong → `401` |
   | `X-User-Id` | platform user UUID; missing/invalid → `401` |
   | `X-Username` | platform username; missing → `401` |
   | `X-User-Name` | display name |
   | `X-User-Email` | user's email; it is also their **From address**; missing → `409` |
   | `X-User-Role` | `ADMIN` or `SALES_MANAGER`; anything else → `403` |

   So the frontend calls **a proxy/BFF path on the ChemOS backend** (e.g.
   `/email-api/*` → `http://<email-service>:8090/api/*`). Make the base URL a single
   configurable constant (`VITE_EMAIL_API_BASE`) and write the client so the proxy
   can be swapped in without touching feature code. For local development against the
   service directly, use a dev proxy (Vite `server.proxy`) that injects the headers
   from env vars — **never from code that ships to the browser**.
2. **CORS** on the service is locked to `http://localhost:3000` by default. If the dev
   server uses another port (Vite = 5173), either run on 3000 or have the backend
   owner add the origin to `CORS_ALLOWED_ORIGINS`. Using a dev proxy avoids CORS entirely.
3. All bodies are JSON except the customer CSV import (`multipart/form-data`, field `file`).
4. Timestamps are ISO-8601 UTC strings. Render them in the user's local time zone.
5. Ownership: a `SALES_MANAGER` sees only their own campaigns (someone else's returns
   `404`); an `ADMIN` sees all. The owner is always the logged-in user.

## 3. Product flow (what the UI must drive)

1. **Connect mailbox** (one-time, but a prerequisite for capturing replies).
2. **Create campaign** — name, chemical, base offer price. Status starts `DRAFT`.
3. **Add recipients** — pick customers from the customer list.
4. **Attach a template pool** — one or more templates rotated across recipients.
5. **Personalize per recipient (optional)** — template choice, display name, price,
   and hand-edited subject/body.
6. **Send** — queues one email per `PENDING` recipient; sending is async.
7. **Track** — recipient statuses move on over seconds/minutes; replies are stored
   server-side.

Mailbox must be connected **before** sending the campaign whose replies you want
captured. If skipped, replies never reach the system and there is no error. The UI
must warn about this loudly on the campaign send step if the mailbox is not healthy.

## 4. Data model (as the UI sees it)

```ts
type Role = "ADMIN" | "SALES_MANAGER";
type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "CANCELLED";
type RecipientStatus =
  "PENDING" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" |
  "REPLIED" | "BOUNCED" | "COMPLAINED" | "FAILED";

interface Product {            // "chemical"
  id: string;                  // caller-chosen, e.g. "UREA-46"
  name: string; hsCode?: string; casNo?: string;
  isActive: boolean; createdAt: string; updatedAt: string;
}
interface Customer {
  id: number; companyName: string; contactName?: string;
  email: string; phone?: string; active: boolean;
}
interface EmailTemplate {
  id: number; name: string; subjectLine: string; htmlBody: string; active: boolean;
  parentTemplateId: number | null;            // set on forks
  personalizedForCustomerId: number | null;   // set on per-customer personalizations
  createdForCampaignId: number | null;
}
interface Campaign {
  id: number; name: string; chemical: Product; offerPrice: number;
  status: CampaignStatus; scheduledAt?: string | null;
  templatePool?: EmailTemplate[];
}
interface CampaignRecipient {
  id: number; customer: Customer; assignedTemplate: EmailTemplate | null;
  overrideRecipientName: string | null; overrideOfferPrice: number | null;
  status: RecipientStatus; trackingToken: string;
  sentAt?: string; openedAt?: string; clickedAt?: string; repliedAt?: string;
}
interface MailboxStatus {
  connected: boolean; connectedAt: string | null; consecutiveFailures: number;
  lastError: string | null; lastErrorAt: string | null; needsReconnect: boolean;
}
```

Treat fields marked optional as possibly absent; verify exact JSON against a real
response during development and adjust the types.

Notes:
- Open/click tracking is **not implemented** in the backend. `OPENED` / `CLICKED`
  exist in the enum but won't normally occur — still render them gracefully.
- `SENT` means the email provider accepted the message, **not** that the customer
  received or read it. Label it "Sent", never "Delivered".
- Template placeholders: `{{customer_name}}`, `{{company_name}}`, `{{chemical_name}}`,
  `{{price}}`, `{{senderName}}`. `customer_name` and `price` can be overridden per
  recipient. Show a placeholder cheat-sheet next to every subject/body editor and a
  live preview that substitutes sample values.

## 5. API contract

Base: `${VITE_EMAIL_API_BASE}` ≙ `/api`. Errors are Spring's default body with **no
message**: `{ "timestamp", "status", "error", "path" }`. Branch on `status`, and write
your own friendly messages (table in section 8).

### Mailbox
| Call | Body | Result |
|---|---|---|
| `POST /mailbox` | `{ appPassword: string (required, ≤255) }` | `200` empty. Connects, or reconnects with a new password. |
| `GET /mailbox` | — | `MailboxStatus` |
| `DELETE /mailbox` | — | `204`. Disconnects and clears the stored credential. |

`appPassword` is a Google **App Password** (Google Account → Security → 2-Step
Verification → App passwords), *not* the user's normal password. There is no "test
connection" call: after `POST`, poll `GET /mailbox` (every ~3 s, up to ~30 s) to show
the result. `needsReconnect: true` means Google rejected the login repeatedly; the
mailbox is **paused** until a new app password is submitted.

### Products (chemicals)
| Call | Body / params | Result |
|---|---|---|
| `GET /products?activeOnly=true` | `activeOnly` default false | `Product[]` |
| `GET /products/{id}` | — | `Product` / `404` |
| `POST /products` | `{ id (req, ≤255), name (req, ≤255), hsCode?, casNo? }` | `Product`; `400` if id exists |

### Customers
| Call | Body / params | Result |
|---|---|---|
| `GET /customers?activeOnly&page=0&size=500` | `size` max 1000 | `Customer[]` + header **`X-Total-Count`** |
| `GET /customers/{id}` | — | `Customer` / `404` |
| `POST /customers` | `{ companyName (req), contactName?, email (req, valid), phone? (≤50) }` | `Customer`; `400` if email exists (case-insensitive) |
| `POST /customers/import` | `multipart/form-data`, field `file` (CSV) | `{ totalRows, imported, skipped, errors: [{rowNumber, email, reason}] }` |

CSV header row must be **exactly** `companyName,contactName,email,phone`.
`companyName` and `email` required; duplicate emails (in file or DB) are *skipped*,
not errors. Provide a "download sample CSV" link and show the import result with the
per-row errors table.

### Templates
| Call | Result |
|---|---|
| `GET /templates/masters` | `EmailTemplate[]` — top-level templates; the picker list |
| `GET /templates/{masterId}/forks` | named + personalized forks of a master |
| `GET /templates/{masterId}/personalized?customerId={id}` | `200` template (that customer's last edit) or `404` (never personalized → use the master's text) |
| `POST /templates/fork` | `{ masterId (req), campaignId?, name?, subjectLine?, htmlBody? (≤200000) }` → `EmailTemplate`. Blank fields fall back to the master. Can only fork a **master**; forking a fork → `400`. |

There is no endpoint to create/edit masters. Templates are seeded server-side.

### Campaigns
| Call | Body | Result |
|---|---|---|
| `POST /campaigns` | `{ name (req), chemicalId (req), offerPrice (req, >0, ≤10 int digits, ≤2 decimals) }` | `Campaign` (`DRAFT`) |
| `POST /campaigns/{id}/recipients` | `{ customerIds: number[] (1–5000) }` | `CampaignRecipient[]`; already-added ids are silently skipped |
| `GET /campaigns/{id}/recipients?page&size` | size ≤1000 | `CampaignRecipient[]` + `X-Total-Count` |
| `PUT /campaigns/{id}/templates` | `{ templateIds: number[] (1–100) }` | the full pool `EmailTemplate[]` |
| `PATCH /campaigns/{id}/recipients/{rid}` | any subset of `{ templateId, overrideName (≤255), overridePrice (>0, ≤2 dec), subjectLine (≤255), htmlBody (≤200000) }` | updated `CampaignRecipient`; `400` if recipient is no longer `PENDING` or not in this campaign |
| `POST /campaigns/{id}/send` | — | `200` empty. Needs status `DRAFT`/`SCHEDULED` and a non-empty template pool. Async. |

Not available: list campaigns, get one campaign, edit, cancel (see section 9).

## 6. Screens to build

### 6.1 App shell
Sidebar: Campaigns, Customers, Chemicals, Templates (read-only), Mailbox.
Header: current user (name, email, role), and a **mailbox health pill** (green
"Replies on", amber "Reconnect needed", grey "Not connected") driven by `GET /mailbox`,
clicking it opens the Mailbox page. Hide nothing by role — both roles can use every
screen; the backend enforces ownership.

### 6.2 Mailbox page
- State machine from `MailboxStatus`: *not connected* → form; *connected & healthy* →
  "Connected since …" + Disconnect; *failing* (`consecutiveFailures>0`, `lastError`) →
  amber banner with the error and "retrying automatically"; *needsReconnect* → red
  banner + reconnect form.
- Form: one password-type field (spaces allowed, e.g. `abcd efgh ijkl mnop`), a short
  how-to for creating a Google App Password, and a note that the credential is
  encrypted at rest and never shown again.
- Disconnect needs a confirm dialog explaining replies stop being captured.

### 6.3 Customers
- Table with search, active filter and **server paging** using `page`/`size` and
  `X-Total-Count` (do not load everything unless size is small). Columns: company,
  contact, email, phone, active.
- "Add customer" dialog (validate required + email format client-side; map `400`
  duplicate-email to a field error).
- "Import CSV" dialog: drag-and-drop, sample download, result summary
  (total / imported / skipped) and a table of row errors.

### 6.4 Chemicals
List with active-only toggle and an "Add chemical" dialog. `id` is user-chosen and
**immutable**, so say so in the form (suggest uppercase-hyphen like `UREA-46`).

### 6.5 Templates (read-only browser)
List masters with subject + sanitized HTML preview. A detail drawer shows forks via
`/forks`, grouped as "Named" (`personalizedForCustomerId == null`) and "Personalized".
Optional: "Save as new template" using `POST /templates/fork`.

### 6.6 Campaign wizard (the main feature)
A stepper with a persistent summary rail. Keep the campaign id in the URL
(`/campaigns/:id/step`) so a refresh doesn't lose place.

1. **Details** — name, chemical (select from `GET /products?activeOnly=true`), base
   offer price (decimal, max 2 places). On submit → `POST /campaigns`.
2. **Recipients** — searchable, paged, multi-select customer picker with "select all
   on page" and a live count. Submit → `POST .../recipients`. Show how many were added.
3. **Templates** — multi-select from `GET /templates/masters` with preview; explain
   "these are rotated round-robin across recipients that you don't pick a template
   for". Submit → `PUT .../templates`.
4. **Personalize** — table of recipients (`GET .../recipients`, paged) with columns:
   customer, assigned template, name override, price override, status. Per-row editor
   (drawer/modal) implementing section 7.
5. **Review & send** — summary (chemical, price, recipient count, templates, how many
   recipients are personalized), **mailbox health check** (block "Send" with a strong
   warning if not connected/healthy, but allow override), and a confirmation dialog
   ("This will email N customers and cannot be undone"). Submit → `POST .../send`.
6. **Progress** — after send, poll `GET .../recipients` (every 5 s while any row is
   `PENDING`, back off to 30 s, stop on tab hidden). Show a status breakdown (bar or
   counts by `RecipientStatus`), a filterable recipient table and a "last updated"
   stamp. Because there is no campaign GET, derive progress from the recipient list.

Resume support: because campaigns cannot be listed (section 9), persist the ids of
campaigns the user created in this browser (`localStorage`, wrapped in try/catch) and
show them on the Campaigns page as "Recent campaigns"; each opens the wizard/progress
view for that id (`GET .../recipients` returns `404` if it isn't theirs or is gone).

## 7. Per-recipient personalization — exact behavior

Each recipient can be changed only while `PENDING`. Edits are independent and optional.

1. Load rows (`GET .../recipients`) and masters (`GET /templates/masters`).
2. User picks a template for a recipient → call
   `GET /templates/{masterId}/personalized?customerId={customer.id}`:
   - `200` → prefill subject/body editors with that fork's text (the customer's own past wording);
   - `404` → prefill from the master's `subjectLine` / `htmlBody`.
3. **Track dirty state.** Remember the prefilled values. In the `PATCH`, include
   `subjectLine` / `htmlBody` **only if the user changed them**. Resending untouched
   prefill forks a pointless "personalization" for every recipient.
4. Always send the **master's** id as `templateId`, never a fork's id.
5. `overrideName` / `overridePrice`: send only when the user set them. To keep the
   default, omit the field. (There is no documented way to clear an override once
   saved — don't offer a "clear" button without confirming with the backend owner.)
6. Edits to subject/body **overwrite in place**: one saved version per
   (template, customer) pair, no history. Show a confirm step before saving body text
   ("This replaces your previous version for this customer.").
7. After a successful `PATCH` replace the row in the cache with the response.
8. A `400` on PATCH means the recipient is no longer `PENDING` (already sent) →
   refresh the list and tell the user the row is locked.

Subject is plain text; body is HTML. Use a safe rich-text/HTML editor, preview inside a
sandboxed `iframe` (or sanitize with DOMPurify), and warn that `{{placeholders}}` must
be kept intact. Never render template or customer HTML unsanitized in the app itself.

## 8. Error handling and UX rules

| Status | Meaning | UI behavior |
|---|---|---|
| `400` | validation failed / duplicate / recipient locked / bad fork | inline field errors where possible; otherwise a toast with context-specific text |
| `401` | key or identity invalid | session problem on the platform side → redirect to platform login / show "session expired" |
| `403` | role not allowed | full-page "You don't have access to this tool" |
| `404` | not found **or not yours** | "Not found or you don't have access" |
| `409` | the user has no email in their profile | blocking message: "Your profile has no email address; ask an admin" |
| `5xx` / network | server/transient | retry button; queries retry 2× with backoff; **never auto-retry non-idempotent POSTs** (especially `/send`) |

General rules:
- **`/send` must be single-flight:** disable the button on click, guard against double
  submit, and on an ambiguous failure (timeout/5xx) *check recipient statuses before
  allowing another send*. The backend has no idempotency keys, so a blind retry could
  email customers twice.
- Every list has loading skeletons, empty states with a clear next action, and error
  states with retry.
- Forms: client-side validation mirrors the limits in section 5; also surface server
  `400`s. Money inputs: positive, max 2 decimals; display with the locale's
  currency formatting (confirm the currency with the product owner — the backend
  stores only a number).
- Accessibility: keyboard-navigable tables/dialogs, labelled inputs, status shown with
  text as well as colour, `aria-live` for send progress.
- Responsive down to tablet; the personalization table may scroll horizontally.
- Status chips: PENDING grey, SENT blue, REPLIED green, FAILED/BOUNCED/COMPLAINED red,
  others neutral. Add a legend/tooltip: "Sent = accepted by the mail provider".
- Don't display tracking tokens by default (internal).
- Never log or persist the app password; clear the field from state right after submit.

## 9. Known gaps — design around these, don't fake them

The backend does **not** currently provide:
1. **List campaigns / get campaign by id.** Use the localStorage "recent campaigns"
   approach in 6.6 and put a clearly-labelled TODO in code to swap to
   `GET /campaigns` when it exists. Isolate it behind a `useCampaigns()` hook.
2. **Edit or cancel a campaign.** Show name/chemical/price as read-only after
   creation; do not render an edit/cancel button (or render it disabled with a
   "coming soon" tooltip).
3. **Reading reply text.** Replies are stored in PostgreSQL for a separate analysis
   service; no endpoint returns them. The UI can show `REPLIED` status and `repliedAt`
   only. Do not build an inbox view.
4. **Unmatched replies** are invisible; don't promise every real-world reply will
   appear as `REPLIED`.
5. **Open/click tracking, unsubscribe, bounce handling** are not implemented.
6. **Scheduled sending**: `SCHEDULED`/`scheduledAt` exist in the model but no endpoint
   sets them. Don't build a scheduler UI.
7. **No sentiment/analysis API** in this service. Out of scope.

Build thin seams (one hook or function per gap) so each can be replaced the moment the
backend adds the endpoint.

## 10. Project structure and quality bar

```
src/
  api/        client.ts (fetch wrapper: base URL, JSON, error mapping, X-Total-Count),
              types.ts, one file per resource (products, customers, templates,
              campaigns, mailbox)
  features/   mailbox/ customers/ products/ templates/ campaigns/ (wizard/, progress/)
  components/ shared UI (DataTable, StatusChip, ConfirmDialog, EmptyState, HtmlPreview)
  hooks/      usePagedQuery, useMailboxStatus, usePolling
  lib/        format.ts (dates, money), sanitize.ts, storage.ts (safe localStorage)
```

- Typed end to end, no `any` for API data. The fetch wrapper converts non-2xx to a
  typed `ApiError { status }` and exposes response headers for paging.
- Query keys per resource; invalidate `["campaign", id, "recipients"]` after any
  recipient/template/send mutation.
- Unit-test the pure logic (dirty-field diffing for PATCH, CSV result mapping, error
  mapping) and component-test the wizard happy path against a mocked API (MSW).
- Provide a `.env.example` with `VITE_EMAIL_API_BASE` and, for the dev proxy only,
  `DEV_API_KEY`, `DEV_USER_ID`, `DEV_USERNAME`, `DEV_USER_EMAIL`, `DEV_USER_ROLE`
  (never prefixed `VITE_`, so they cannot be bundled).
- Deliver: the app, a README with run instructions, and a short list of any
  assumptions or contract mismatches you found.

## 11. Acceptance checklist

- [ ] No API key or identity secret exists in any browser bundle or network request
      from the browser to the email service.
- [ ] A user can: connect mailbox → create campaign → add recipients → attach
      templates → personalize one recipient → send → watch statuses update.
- [ ] Personalization `PATCH` omits unchanged subject/body, and always sends a master id.
- [ ] Send button is single-flight, confirmed, and not blindly retried.
- [ ] Customer and recipient lists use server paging with `X-Total-Count`.
- [ ] CSV import shows imported/skipped counts and per-row errors.
- [ ] Mailbox pill/banner reflects `connected`, failing, and `needsReconnect`.
- [ ] All error statuses in section 8 are handled with distinct, friendly messages.
- [ ] Known gaps are handled as in section 9 with swappable seams and no fake data.
