# Maternal health assistant

Open `/patient/chat` (AI Assistant). The module supports maternal-health Q&A through locally stored, sourced education resources, English/Hindi/Kannada replies, new conversations and paginated history. Questions outside those resources receive an honest fallback. It provides education, not diagnosis, test interpretation, prescribing or medication changes.

## Context and privacy

Saved pregnancy dates and the latest dated numerical health readings are used only when the user selects the context checkbox. Replies display the data's date and LMP estimate. Names, contact details, medical-history text, metric notes, journal entries and screening narratives are not fetched into context. Every conversation and history request is restricted to the owner; even admins and assigned staff cannot read another user's private chat. Care-team access to an automatically created referral includes only a short safety reason, not the question or full history.

Questions/replies are saved together as an atomic ChatTurn. Server-generated message IDs persist across reloads. Existing ChatMessage history remains readable through the combined paginated API. Network retries use the same requestId and return the original turn; changed content or consent under that ID returns 409. Overlapping sends are guarded by a conversation lease; rapid sends are limited to 20 new turns per minute. Application-level rate limits also apply. Chat history currently follows the application's database retention policy; this module does not implement a separate deletion or retention schedule.

## Urgent concerns

Conservative text screening runs before resource retrieval or optional AI calls. It recognizes selected maternal warning signs and self-harm phrases in English, Hindi and Kannada. Explicit English negation and general educational questions are handled separately; ambiguous reports err toward urgent assessment. This phrase-based screen is incomplete and is not a clinical triage or diagnostic system. A negative screen never establishes safety.

An urgent reply tells the user to seek medical assessment immediately and not wait for the app. The backend saves urgent alerts and pending referrals, deduplicated by patient, warning category and India day, including across conversations. A pending referral has no assigned accepting clinician and does not promise emergency dispatch, notification delivery or clinical review. Escalation failure is shown honestly; durable pending/failed escalations are retried by the existing minute-based worker and by an identical send retry. The user must contact maternity/emergency services directly.

The warning guidance is based on [CDC HEAR HER](https://www.cdc.gov/hearher/maternal-warning-signs/index.html); general replies link to their source resources, including [NHS pregnancy nutrition](https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/).

## Optional generative AI

Local resources work without an API key. To enable OpenAI, configure the backend's private `.env` with `CHAT_PROVIDER=openai`, `OPENAI_API_KEY` and `CHAT_MODEL` (an available Responses-compatible model supporting structured outputs), then restart the backend. Never commit the key or expose it through VITE variables.

A separate unchecked checkbox appears only when the provider is configured. It explicitly authorizes sending the current question and selected health context to OpenAI. Full conversation history is not sent. The API requires that separate consent flag; health-context consent alone does not authorize external AI. Urgent and medication-boundary questions remain entirely local. Unknown questions with no supporting source remain local fallbacks.

The adapter uses a fixed Responses endpoint, a 15-second timeout, bounded output, no tools, `store:false` and a strict supported-answer/source-index schema. Unsupported, malformed, incomplete or conspicuously unsafe replies fall back to local resources; the UI labels AI-generated and fallback replies. These checks reduce risk but cannot prove clinical correctness or complete grounding. Clinical evaluation remains part of final release QA. `store:false` does not by itself mean zero retention; [OpenAI's data controls](https://developers.openai.com/api/docs/guides/your-data) apply. The request format follows [official structured-output documentation](https://developers.openai.com/api/docs/guides/structured-outputs).

## API

All routes require authentication; patients create/send their own conversations. Existing admins can list/read only their own legacy history, with no cross-patient override.

- `GET /api/v1/chat/capabilities`: reports optional provider availability, without exposing credentials.
- `POST /api/v1/chat`: optional trimmed title, up to 200 characters.
- `GET /api/v1/chat?page=1&limit=20`: owner conversation history.
- `GET /api/v1/chat/:id`: owner detail.
- `POST /api/v1/chat/:id/messages`: trimmed message (1–2000 characters), required UUID requestId, optional language (`en`, `hi`, `kn`), useHealthContext and allowExternalAi (both default false). Optional conversationId must match the route.
- `GET /api/v1/chat/:id/messages?page=1&limit=100`: latest history page, chronological within the page; older pages are available. Limit is capped at 100.

Writes reject unknown fields. Query parameters are strict positive integers up to 1,000,000; the returned page size is capped at 100. Startup awaits the turn/referral deduplication indexes before accepting requests. Error UI preserves the draft, exposes history retry, and disables overlapping sends/conversation switching. Both history navigation and new-conversation controls work on small screens; the newest reply scrolls into view.

## Verification and running

Backend integration and provider tests cover atomic pair persistence, replay deduplication, owner isolation, staff/admin denial, private context exclusion, urgent escalation/recovery, existing history, pagination, validation, throttling, localization, separate external consent, structured output and provider failure. Provider calls are mocked: no real health data or paid API requests are used during tests. Frontend tests cover first-message routing, failed draft/retry identity, context and external consent, saved urgent status, links, history retry/pagination, safe text rendering and overlapping sends.

All 144 backend and 125 frontend regression tests passed. Shared and production frontend/backend builds passed; the backend type check passed after the final safety/worker adjustments. An initial Windows fork-worker crash was resolved by running the backend suite with the threads pool.

Live verification used a synthetic patient and temporary database/backend on 5002 and frontend on 5175. Verified first-question creation, sourced diet replies, optional 24-week-plus-3-day pregnancy/metric context, saved replies after reload, a separate conversation, immediate urgent advice, the pending referral notice, and the saved entries in Referrals and Alerts. The user's original database and app are left intact. Real OpenAI connectivity requires a configured key/model and is not verified by the mocked tests. Temporary QA services are stopped afterward.

In VS Code open `C:/Users/vinut/maaSuraksha`, ensure MongoDB is running, and run `npm run build:shared` after shared changes. Run `npm run dev:backend` and `npm run dev:frontend` in separate terminals; open `http://localhost:5173/login` and select AI Assistant. Use Vite's printed port if 5173 is occupied. Push the Git checkpoint with `git push origin vinutha-work`.
