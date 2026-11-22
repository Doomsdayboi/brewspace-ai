# BrewSpace AI — Product Requirements Document

**Tagline:** Your café. Your space. Your people.  
**Version:** 1.0 (proposed)  
**Date:** 22 November 2026  
**Status:** Draft for product and engineering alignment  
**Product type:** Mobile-first, AI-powered café experience platform  
**Initial delivery:** Google AI hackathon MVP, designed for extension into a real café pilot

> **Product thesis:** A café visit should adapt to a customer's intention. BrewSpace combines **Café Flow** (where to spend time), **Café Connect** (who to meet), and **Coffee Circles** (what to do together), coordinated through one shared visit context and a Gemini-powered assistant.

## 1. Executive summary

BrewSpace is a mobile-first web application launched by scanning a café QR code. A customer describes what they want from their visit in natural language: to work quietly, read, meet someone with shared interests, or join a short group conversation. BrewSpace interprets that intention, suggests a suitable space, and—only with explicit social consent—offers relevant one-to-one connections or small Coffee Circles at appropriate times.

Three independent product modules operate on a shared, real-time **Visit Context**. The **Experience Orchestrator** uses Google Gemini to turn conversation into structured intent and to explain relevant suggestions. Deterministic backend services remain authoritative for seat status, availability, consent, eligibility, capacity, and reservations. As a customer's intent changes, the modules react without requiring the customer to start over.

**Illustrative value proposition:** “I need a quiet table for an hour, and afterward I'd like to discuss AI with other developers.” BrewSpace can suggest an available quiet seat, respect focus time, and later propose a compatible person or an AI-focused Coffee Circle.

The MVP demonstrates this full journey in a single café using a QR check-in, digital seat map, interest profiles, mutual opt-in, automatic circle proposals, and real-time updates. It does not depend on paid ordering integrations, camera surveillance, or production-quality crowd prediction.

## 2. Problem, opportunity, and differentiation

### 2.1 Customer problems

- **Finding an appropriate space is uncertain.** Customers cannot reliably tell where the quiet, social, outlet-equipped, or group-friendly seats are.
- **Social opportunities are invisible.** People with compatible interests may be nearby but have no comfortable, respectful way to initiate contact.
- **Group activities require coordination.** Informal conversations rarely happen organically when participants, timing, seating, and a topic must all align.
- **A single visit has changing intentions.** Someone may want to work first and socialize later, but café services rarely support transitions.
- **Café teams lack a lightweight coordination view.** Even an opt-in social experience can create seating conflicts or unclear usage without basic staff oversight.

### 2.2 Differentiation

BrewSpace is **not** three separate apps wrapped around a chatbot. Its distinctive behavior is **intent-aware, time-aware, consent-aware orchestration across physical space and social interaction**. The shared Visit Context allows Café Flow, Café Connect, and Coffee Circles to produce complementary suggestions and respond to one another's state changes.

### 2.3 Product principles

1. **One visit, one context:** user preferences are captured once and evolve during the visit.
2. **Intent before features:** ask what the customer wants to accomplish, not which module they want to open.
3. **Calm by default:** focus sessions suppress social interruptions.
4. **Consent before connection:** social discovery is off by default; there are no unsolicited introductions or seat disclosures.
5. **AI for understanding; code for enforcement:** Gemini suggests and explains, while backend rules validate actions.
6. **Modular by design:** modules can be replaced or developed independently against agreed contracts.
7. **Reliable in a live café:** uncertain seat data and unavailable AI should degrade gracefully.

## 3. Goals, success criteria, and non-goals

### 3.1 MVP goals

- Convert a natural-language customer request into a structured Visit Context.
- Recommend an available seat that fits the customer's immediate needs.
- Let customers intentionally opt into one-to-one matching and/or group activities.
- Suggest an eligible 1:1 connection with mutual acceptance.
- Create or suggest a Coffee Circle from overlapping interests and availability, with a suitable group table.
- Coordinate transitions such as **FOCUSING → AVAILABLE** without duplicate onboarding or unwanted interruptions.
- Demonstrate a real-time occupancy change altering a circle's seating plan.
- Provide café staff with a simple, auditable occupancy and circle view.

### 3.2 Indicative pilot measures (hypotheses, not promises)

| Metric | Definition | Initial validation target |
|---|---|---|
| Activation | Share of check-ins that establish a visit intention | ≥80% in moderated usability testing |
| Seat recommendation usefulness | Share of users who say suggested seats meet their requirements | ≥75% in a small pilot |
| Social consent clarity | Users who correctly understand what opting in exposes | 100% in usability checks before launch |
| Mutual connection rate | Accepted matches divided by requests sent | Establish baseline; no arbitrary volume target |
| Circle completion rate | Circles that meet minimum attendance and complete | Establish baseline in pilot |
| Interruption rate | Social notifications delivered during focus mode | 0, except explicit critical service notices |
| Data correctness | Double-bookings generated by the system | 0 in tested concurrent scenarios |

Targets will be revisited after a genuine pilot; a hackathon simulation is not evidence of production impact.

### 3.3 Explicitly out of scope for MVP

Food ordering, payment and loyalty systems; table-service logistics; long-term social networks or direct messaging; cross-café matchmaking; audio recording or emotion recognition; automated camera-based occupancy; prediction of future crowd levels without historical data; AI-driven moderation of live conversations; verified professional identities; and integration with external calendars.

## 4. Users and permissions

| Persona | Needs | Core actions |
|---|---|---|
| **Focus Visitor** | Quiet seat, outlet, few interruptions | State purpose, choose seat, set focus period, end session |
| **Social Explorer** | Discover like-minded people without awkward cold approaches | Set interests, enable Connect, review and accept match |
| **Circle Participant** | Join a short, welcoming group discussion | Explore/accept invitations, locate group, leave or provide feedback |
| **Café Operator** | Keep seat data accurate and prevent disruption | Update seats, define quiet/social zones, manage circles, handle reports |
| **Demo Administrator** | Reproduce scenarios reliably | Seed test users, set occupancy, trigger simulated events |

**Access rules:** customers see their own visit and appropriately anonymized suggestions. They do not see private profiles, exact seats, or contact details of other customers before mutual consent. Operators can view operational occupancy and circle state, not private user interests unless necessary and explicitly permitted for operational reasons. Admin capabilities are restricted to demonstration/staff roles.

## 5. Core product model: Visit Context

A **Visit** is a time-bounded session associated with one café. A user can update visit goals without creating a new profile. The server is the source of truth for live visit status.

**Minimum fields:** `visitId`, `cafeId`, `userId`, `startedAt`, `expiresAt`, `intents[]`, `interests[]`, `spacePreferences`, `plannedDepartureAt`, `focusUntil`, `availabilityWindows[]`, `connectOptIn`, `circlesOptIn`, `currentMode`, `seatId`, `version`.

**Modes:**

- `PLANNING`: checked in, configuring preferences.
- `FOCUSING`: customer requests minimal interruption; matching can be prepared but no social invitations are surfaced.
- `AVAILABLE`: customer has opted into applicable social experiences and is available now or within a declared window.
- `IN_CONNECTION`: a mutually accepted 1:1 meetup is active.
- `IN_CIRCLE`: participating in a group session.
- `ENDED`: visit is closed, so the customer is ineligible for live discovery.

**Rules:** a user may have only one active visit per café; mode transitions are validated server-side; a visit expires after café-configured inactivity/closing rules; presence is based on check-in and reasonable expiration rather than continuous location tracking. Enabling Connect and Circles are **separate consents**. A user may be available yet have both disabled.

## 6. Functional requirements

Priority definitions: **P0** = necessary to demonstrate the integrated MVP; **P1** = strengthens pilot readiness; **P2** = later enhancement.

### 6.1 Check-in, intent capture, and unified assistant

**FR-001 — QR entry [P0].** A café-specific QR code opens a mobile-friendly web app with the correct café preselected.  
*Acceptance:* opening the code creates no social exposure; a new visitor can start within two screens, and an existing visit resumes safely.

**FR-002 — Lightweight identity [P0].** Permit temporary sign-in or anonymous session identity with a display alias.  
*Acceptance:* private visit data cannot be read using another session token; identity survives a normal page reload.

**FR-003 — Natural-language intent [P0].** Gemini extracts intents, time horizon, space preferences, interests, and social availability into schema-validated structured output.  
*Acceptance:* “Work quietly for 45 minutes, then meet AI developers” yields a focus period followed by social availability; unknown fields are rejected; ambiguous time is clarified or safely left unspecified.

**FR-004 — Editable context [P0].** The user can inspect and modify inferred preferences manually.  
*Acceptance:* user edits override an AI inference; updates are reflected across relevant modules without re-onboarding.

**FR-005 — Unified home [P0].** Show current mode, seat, next suggested action, and optional entry points to Space, Connect, and Circles.  
*Acceptance:* the customer can reach each area in one tap and always return to the main assistant.

**FR-006 — Consent controls [P0].** Provide separate explicit toggles for 1:1 matching and group discovery, defaulted off.  
*Acceptance:* disabling either immediately removes the user from new candidate searches for that module.

### 6.2 Café Flow — space and visit management

**FR-101 — Seat inventory [P0].** Each café defines seats or tables with ID, zone (`QUIET`, `GENERAL`, `SOCIAL`, `GROUP`), capacity, outlet availability, and current status.  
*Acceptance:* unavailable seats are never recommended as bookable; occupancy state is shared across client and staff views.

**FR-102 — Rule-based ranking [P0].** Rank available seats using fit with user preferences, intended activity, capacity, and zone compatibility. Gemini may explain the ranking but must not invent seat attributes.  
*Acceptance:* an available quiet seat with outlet ranks above a louder seat without an outlet for a request requiring both.

**FR-103 — Select/confirm seat [P0].** A customer can confirm an available seat; the server atomically verifies the seat has not been claimed.  
*Acceptance:* when two customers select the final seat simultaneously, at most one succeeds and the other sees a clear alternative.

**FR-104 — Focus mode [P0].** User can set, extend, or end a focus session.  
*Acceptance:* standard social invitations are withheld during focus; on ending focus, the Visit Context updates and eligible suggestions refresh.

**FR-105 — Live updates [P0].** Occupancy changes from user check-ins or staff updates invalidate stale suggestions.  
*Acceptance:* a seat marked occupied disappears from selectable options without refreshing the page.

**FR-106 — Environment forecasting [P2].** Predict noisy or busy periods only after real historical data and quality checks exist.

### 6.3 Café Connect — respectful 1:1 matching

**FR-201 — Interest capture [P0].** Capture user-entered interests and optional meeting goal (learn, exchange ideas, network, casual conversation).  
*Acceptance:* the user can edit interests and opt out at any time.

**FR-202 — Eligible candidate filtering [P0].** Consider only opted-in users with active visits at the same café, compatible declared availability, no blocks, and no conflicting active meetup.  
*Acceptance:* opted-out, expired, blocked, or busy customers never enter the suggested-match result set.

**FR-203 — Compatibility ranking [P0].** Rank eligible candidates using overlapping/semantically related interests, mutual meeting goals, and time overlap.  
*Acceptance:* system can explain common interests using actual profile information; availability and consent cannot be bypassed by a score.

**FR-204 — Mutual acceptance [P0].** Send a limited anonymous teaser to one candidate; disclose an agreed display alias and meetup instructions only after both accept.  
*Acceptance:* rejection/timeout reveals no personal details or exact seat; acceptance cannot be forged from another session.

**FR-205 — Connection lifecycle [P1].** Allow request expiry, cancellation, completion, block, and report.  
*Acceptance:* a canceled or reported connection is removed from active results, and blocked pairs are not suggested again.

**FR-206 — Introduction assistance [P1].** Gemini suggests a short optional conversation starter from shared, consented interests.  
*Acceptance:* generation never uses private information hidden from the other participant.

### 6.4 Coffee Circles — opt-in group experiences

**FR-301 — Group opportunity detection [P0].** Find clusters of 3–6 opted-in available customers with a meaningful common topic and overlapping time window.  
*Acceptance:* unrelated customers or unavailable focus users are excluded; a group is only proposed if a valid time and potential seat exist.

**FR-302 — Proposal and RSVP [P0].** Present topic, approximate duration (default 20 minutes), general area, participant count, and an explicit join action.  
*Acceptance:* invitation expires; decline does not create membership; participation is confirmed only after RSVP.

**FR-303 — Group activation [P0].** Activate only after a minimum of 3 participants accept and a suitable group table is verified/held.  
*Acceptance:* if quorum or space is unavailable, the group remains proposed or is canceled with a clear reason; capacity is never exceeded.

**FR-304 — Topic assistance [P0].** Gemini generates a concise title, description, and 2–3 inclusive optional conversation starters.  
*Acceptance:* prompts are relevant to user-consented shared interests; no continuous listening or conversation recording occurs.

**FR-305 — Group lifecycle [P1].** Support waitlist, no-show handling, reschedule, group completion, leave, and post-session feedback.  
*Acceptance:* group attendance and seat assignments update atomically enough to avoid duplicate capacity allocation.

**FR-306 — Operator-created circles [P1].** Staff may schedule a public circle with topic, time, maximum participants, and designated table.  
*Acceptance:* manually scheduled and AI-proposed circles share one RSVP and occupancy model.

### 6.5 Cross-module orchestration

**FR-401 — Shared context events [P0].** Publish events for relevant changes: `VISIT_STARTED`, `INTENT_UPDATED`, `FOCUS_ENDED`, `SEAT_CHANGED`, `MATCH_ACCEPTED`, `CIRCLE_PROPOSED`, `CIRCLE_JOINED`, `CIRCLE_CANCELED`, `VISIT_ENDED`.  
*Acceptance:* modules react to relevant changes without calling into each other's internal databases; repeated events do not produce duplicate invitations.

**FR-402 — State-aware recommendations [P0].** Orchestrator chooses which modules to invoke based on current mode, user goals, consent, and valid tools.  
*Acceptance:* a focus-mode user gets a seating/focus response, not a social interruption; a newly available user can receive eligible social options.

**FR-403 — Conflict resolution [P0].** A customer cannot be assigned to overlapping active 1:1 meetings and circles; a group table cannot be occupied by another live booking.  
*Acceptance:* conflicting actions fail safely with an understandable alternative rather than a double booking.

**FR-404 — Proactive suggestions with limits [P1].** Show a relevant suggestion after a state change with throttling and deduplication.  
*Acceptance:* no repeated matching spam; user can mute proactive suggestions for the visit.

### 6.6 Staff and operations

**FR-501 — Staff dashboard [P0].** Display seat map and status, active circles, and simple controls to toggle occupancy and simulate events.  
*Acceptance:* staff changes propagate to customer clients in real time; normal customers cannot access staff actions.

**FR-502 — Safety and moderation [P1].** Staff may pause circle creation, close a problematic circle, and review user reports.  
*Acceptance:* reports are restricted to authorized staff and do not expose unnecessary personal information.

## 7. End-to-end user journeys

### Journey A — Focus first, connect later (hero journey)

1. Alex scans the café QR code and says: “I want a quiet table for 60 minutes, then to meet people interested in AI startups.”
2. Gemini parses `FOCUS + CONNECT`, a 60-minute focus period, and interests such as `AI` and `startups`.
3. BrewSpace clearly asks Alex whether to enable 1:1 discovery and circle invitations; neither is preselected.
4. Café Flow recommends Q3, an available quiet seat with an outlet. Alex confirms.
5. Focus begins. Matching may evaluate eligible candidates in the background but social invitations do not interrupt Alex.
6. Alex taps **Finish focus**. Visit mode changes to `AVAILABLE` and the experience coordinator refreshes recommendations.
7. Café Connect offers a consent-safe match with Sam, who shares relevant interests and availability.
8. Coffee Circles also offers a 20-minute AI Builders Circle if enough available participants express interest.
9. Alex chooses the circle. The RSVP service verifies capacity and the group-table state before confirming.
10. If that table becomes unavailable, Café Flow supplies a valid alternative; participants receive an updated location without restarting the circle.

### Journey B — Social-only visitor

A user checks in with “I have 25 minutes and want to meet someone interested in books.” The app skips focus setup, asks for social consent, checks the current availability window, and proposes a suitable 1:1 conversation or existing circle. If no one is eligible, it says so and offers browsing the café normally rather than fabricating matches.

### Journey C — Quiet-only visitor

A visitor asks for a quiet table and disables all social features. BrewSpace gives seating recommendations and a focus timer. The user is not visible in Connect or Circles, and no social prompts are shown.

### Journey D — Circle conflict

A proposed four-person circle is awaiting confirmations. Another customer occupies the suggested group table. Before activation, the backend tries another compatible group seat. If none exists, the group is rescheduled or canceled; the system never silently places people at an occupied table.

## 8. UX and information architecture

**Entry:** QR → Welcome/guest identity → Natural-language intention → Consent review → Suggested plan.

**Main navigation:**

- **Today:** current visit, AI assistant, mode, seat, next relevant suggestion.
- **My Space:** digital floor plan, seat details, selected seat, focus control.
- **Connect:** opt-in status, eligible proposals, pending/accepted matches.
- **Circles:** suggested and active group experiences, RSVP and conversation starters.
- **Settings:** interest edits, privacy, availability, block/report, end visit.

**UI behaviors:** display recommendations as explanations with confirm/reject actions, not as facts about other customers. All consequential actions must require a deliberate click/tap. Distinguish “Suggested,” “Pending,” and “Confirmed.” Show connection/seat states from server data. Offer direct non-chat controls when AI is unavailable. Use accessible contrast, screen-reader labels, keyboard navigation, and simple consent wording.

## 9. Matching, seating, and group formation logic

### 9.1 Seat recommendations

Apply **hard constraints** first: correct café, `AVAILABLE` status, sufficient capacity, zone compatibility, and requested required features. Rank survivors using a configurable weighted score for quietness, outlet, duration suitability, and distance from disturbance zones if those attributes are available. Return the top 3 available suggestions with honest reasons. All confirmation writes require server-side revalidation.

### 9.2 Café Connect candidate matching

Eligibility gate: active same-café visit + explicit Connect consent + overlapping availability + non-conflicting mode + no block/report restrictions + no conflicting live meeting. For eligible pairs, a prototype score can weight **semantic interest similarity (50%)**, **meeting-goal alignment (30%)**, and **time overlap (20%)**. These are implementation starting values, not empirically optimized weights. Show at most a small shortlist, limit repeated requests, and require both parties to accept.

### 9.3 Coffee Circle formation

Create candidate topic clusters from opted-in interests (Gemini can normalize synonyms). Find a common 20-minute window and a table for 3–6 people. Prefer an existing suitable circle before proposing a new one. Proposals are provisional; only confirmed RSVPs count toward the quorum of 3. On quorum, atomically hold a compatible table and activate the circle. Expired RSVPs and canceled circles release holds. If capacity becomes insufficient, stop new joins and present alternatives.

### 9.4 AI decision boundary

Gemini may **parse**, **summarize**, **classify**, **explain**, **generate discussion prompts**, and **select approved tool calls**. It may not bypass privacy filters, invent users, mark seats occupied/free, directly change membership without consent, or assert a circle is confirmed before the backend confirms it. All generated tool arguments undergo schema validation and authorization.

## 10. Technical architecture

**Frontend:** React or Next.js progressive web app, optimized for smartphone browsers.  
**Auth:** Firebase Authentication (anonymous/guest prototype; pilot may require verified accounts or anti-abuse controls).  
**AI:** Google Gemini API with structured output, scoped function calling, and prompt/version management.  
**Backend:** TypeScript on Cloud Run or Firebase Cloud Functions, with modular services and shared API contracts.  
**Realtime persistence:** Cloud Firestore with security rules, transactional writes, and live subscriptions.  
**Hosting:** Firebase Hosting.  
**Notifications:** In-app toasts for MVP; Firebase Cloud Messaging optional for later use.

**Logical components:**

- **Experience Orchestrator:** manages requests, intent parsing, capability selection, and explanations.
- **Visit Service:** owns shared context and lifecycle.
- **Flow Service:** owns seating rules, seat occupancy, and seat allocation.
- **Connect Service:** owns opt-in eligibility, matching, introductions, and blocks.
- **Circles Service:** owns grouping, RSVPs, seating requirements, and lifecycle.
- **Event/Notification Service:** fans out state changes, deduplicates jobs, and respects focus/notification preferences.
- **Staff Service:** restricted dashboard, occupancy edits, safety controls, and audit history.

The orchestrator calls stable interfaces such as `getSeatSuggestions(visitId)`, `confirmSeat(visitId, seatId)`, `getConnectSuggestions(visitId)`, `respondToMatch(matchId, decision)`, `getCircleSuggestions(visitId)`, and `respondToCircle(circleId, decision)`.

**Integration pattern:** the service changing authoritative state writes an event in the same transaction where practical; event handlers process updates idempotently. For MVP, Firestore triggers and listeners are sufficient; no Kafka infrastructure is required. Include event IDs, versions, and timestamps to prevent stale updates or repeated invitations.

## 11. Data model

| Collection | Key fields | Data owner |
|---|---|---|
| `cafes` | `name`, `timezone`, `hours`, `zones`, `policy` | Staff Service |
| `seats` | `cafeId`, `seatId`, `zone`, `capacity`, `features`, `status`, `version` | Flow Service |
| `users` | `alias`, `interestTags`, `accountSettings`, `createdAt` | Identity/Profile Service |
| `visits` | `cafeId`, `userId`, `mode`, `intents`, `preferences`, `focusUntil`, `consents`, `seatId`, `expiresAt` | Visit Service |
| `matches` | `cafeId`, `participantIds`, `reasons`, `responseByUser`, `status`, `expiresAt` | Connect Service |
| `circles` | `cafeId`, `topic`, `startAt`, `endAt`, `capacity`, `seatId`, `status`, `participantIds` | Circles Service |
| `rsvps` | `circleId`, `userId`, `status`, `respondedAt` | Circles Service |
| `events` | `eventId`, `type`, `entityId`, `version`, `occurredAt`, `processedAt` | Event Service |
| `reports` | `reporterId`, `targetType`, `targetId`, `reason`, `status` | Staff/Safety Service |

**Consistency:** use Firestore transactions for seat claiming and circle activation; enforce a maximum one active conflicting event per participant; include TTL/expiration indexes for visits, proposals, and event deduplication records. Avoid storing a second source of truth for seat occupancy inside other modules.

## 12. Privacy, trust, and safety

- **Privacy defaults:** Connect and Circles off by default; no contact sharing or public user directory.
- **Selective disclosure:** teasers reveal only consented interest overlap and approximate timing; aliases and meetup details become visible only after mutual acceptance.
- **Focus protection:** no social prompts during focus; urgent operational notices may still appear.
- **Physical safety:** meetups occur in public, café-designated areas; do not reveal another person's exact seat or precise device location before agreement.
- **User controls:** pause discovery, decline invites, cancel participation, block/report, delete account data where applicable, and end a visit.
- **Data minimization:** collect only fields needed for the experience; never record ambient conversation or infer sensitive personal traits from chat content.
- **Retention:** automatically expire visit state and proposals; configure minimal retention for abuse reports and operational auditing, with defined deletion policy before a real pilot.
- **Security:** authenticated authorization on every backend action, least-privilege Firestore rules, staff-only administrative access, rate limits, abuse detection, and prompt-injection-resistant tool validation.
- **Pilot review:** perform privacy, legal, accessibility, safeguarding, and local policy review before deploying to real customers; the hackathon demo uses consenting test accounts.

## 13. Non-functional requirements

| Area | MVP requirement |
|---|---|
| Responsiveness | Core UI interactions feel immediate; show progress for AI operations and avoid blocking seat controls on AI latency |
| Real-time state | Seat and circle changes normally propagate within a few seconds in test conditions |
| Availability | If Gemini fails, manual seat navigation and existing confirmed memberships remain usable |
| Correctness | Transactions and server validation prevent double seat assignment or over-capacity circle activation |
| Idempotency | Retries and duplicate event delivery do not duplicate membership, invitations, or holds |
| Accessibility | Keyboard support, semantic controls, readable contrast, and screen-reader-compatible status updates |
| Observability | Request IDs, structured service logs, AI parse failure rates, event processing errors, and key funnel analytics |
| Security | Role-based access, private-by-default rules, and controlled use of customer-generated text |
| Cost control | Cache stable topic/interest normalization; batch or limit AI calls; use deterministic filtering before Gemini ranking |

## 14. Analytics and instrumentation

Track privacy-conscious events such as `qr_opened`, `visit_created`, `intent_parsed`, `intent_corrected`, `consent_changed`, `seat_suggested`, `seat_confirmed`, `focus_started`, `focus_ended`, `match_proposed`, `match_accepted`, `circle_invited`, `circle_joined`, `circle_activated`, `circle_completed`, `report_submitted`, and `visit_ended`.

Analyze each funnel separately: **visit activation → seat success**, **opt-in → mutually accepted connection**, and **circle proposal → quorum → completion**. Also monitor suggestion dismissals, notifications during focus, stale seat rejections, moderation reports, and AI fallback use. Prefer aggregate reporting; avoid sending raw sensitive interests or message text into analytics.

## 15. Edge cases and failure handling

| Situation | Required behavior |
|---|---|
| All quiet seats occupied | Show truthful availability; suggest alternative zones or wait without making false promises |
| Two users select the same seat | Atomic transaction lets one claim; other receives refreshed options |
| No eligible people nearby | Show “No suitable matches right now,” not synthetic people |
| Match accepted by only one person | Keep pending until both accept or request expires; do not reveal private details |
| Customer changes consent mid-invite | Re-evaluate eligibility and invalidate pending exposure or proposals |
| Focus session runs longer | Recompute availability; avoid sending expired invitations |
| Circle loses quorum | Deactivate or reschedule and notify accepted participants |
| Group table becomes occupied | Reassign only to a confirmed compatible table; otherwise cancel/reschedule |
| Visit expires or user leaves | Remove from matching and group eligibility; release applicable holds |
| Gemini returns malformed output | Retry bounded validation once, then request structured manual input |
| Duplicate realtime event | Idempotency key prevents duplicate suggestions and writes |
| Network reconnect | Resubscribe, refetch authoritative state, and reconcile outdated local actions |
| User reports harassment | Block participant visibility immediately; record report for authorized review |

## 16. MVP delivery plan

**Phase 0 — Product setup and data contracts:** finalize café floor model, Visit Context, permissions, API contracts, and demonstration accounts.  
**Phase 1 — Shared core + Café Flow:** QR check-in, Gemini intent parser, session state, seat inventory, ranking, and transactional seat selection.  
**Phase 2 — Café Connect:** opt-in controls, eligibility filtering, ranking, mutual accept/reject, and focus-aware surfacing.  
**Phase 3 — Coffee Circles:** topic clustering, proposal, RSVP, quorum, seat allocation, and generated discussion starters.  
**Phase 4 — Integration + demo hardening:** event-driven transitions, staff simulator, race-condition tests, error states, and seeded demo data.

**If scope must be cut:** keep one café, a static floor plan, four seeded customer accounts, one matching algorithm, one 20-minute circle template, and a single strong cross-module demo. Cut sophisticated ranking, push notifications, user history, and visual polish before cutting shared-context transitions or mutual consent.

## 17. Quality assurance and acceptance plan

- **Unit tests:** time-window overlap, seat suitability, matching eligibility, consent filters, group quorum and capacity, event deduplication, and state transitions.
- **Integration tests:** Gemini structured-output validation, authenticated service calls, Firestore transactions, and reactive updates across modules.
- **Concurrency tests:** simultaneous seat selection; competing RSVP requests for last group spot; late consent changes.
- **End-to-end tests:** quiet-only visit; focus-then-connect; circle formation; table reallocation; visit expiration; offline/reconnect.
- **Safety tests:** unauthorized user trying to read others' visits; unaccepted match details; blocked users; guest abuse/rate-limit behavior.
- **Usability tests:** verify users understand consent, confirmation states, how to finish focus, and how to leave/report a group.

**MVP release gate:** all P0 requirements pass; one complete hero journey works across at least four test clients; a live occupancy change is reconciled correctly; no known double booking or unauthorized data exposure remains; fallback behavior is demonstrated when the AI service is unavailable.

## 18. Hackathon demonstration script

1. Open customer A on a phone: “I want to work quietly for one hour and later discuss AI with other developers.”
2. Show Gemini's structured interpretation and separate Connect/Circles opt-in controls.
3. Confirm a quiet seat through Café Flow; focus mode starts.
4. Open seeded customers B, C, and D on separate clients; show different interests and availability.
5. While A is focusing, show compatible candidates exist but no distracting social notifications are sent.
6. End A's focus session early. The shared Visit Context changes immediately.
7. Show a consensual Café Connect proposal and an AI Builders Coffee Circle suggestion.
8. Accept the circle with enough users and assign a group table.
9. On the staff dashboard, mark that table unavailable. Show the system choosing another compatible table and updating all participants.
10. End with the Gemini-generated conversation starters and a unified summary of the customer's visit.

**What this demonstrates:** one assistant, three modules, consent-aware intelligence, deterministic operational rules, shared real-time state, and tangible cross-module coordination.

## 19. Risks, assumptions, and open questions

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| Low density of concurrent interested users | Seed the hackathon with test users; later encourage staff-scheduled circles or interest windows |
| Privacy discomfort | Explicit opt-ins, anonymized teasers, simple controls, no proximity surveillance |
| Hallucinated availability or “matches” | Authoritative backend filters and tool results; Gemini cannot fabricate operational state |
| Stale seat information | Staff updates, self-check-in confirmation, realtime listeners, transaction revalidation |
| Poor match quality | Collect lightweight feedback, tune ranking, never force interaction |
| Group no-shows and awkward meetings | Small groups, clear RSVP deadlines, easy exit, optional discussion starters |
| Scope overload | Prioritize one coherent hero journey and shared-context behavior over breadth |
| AI cost/latency | Structured single-pass parsing, cached normalization, deterministic candidate filtering |

### Assumptions to validate

- The café agrees to provide an opt-in digital floor plan and designated group seating.
- Customers are comfortable using a QR-based web application.
- Users will give honest approximate visit durations and interest tags.
- Enough concurrent opt-in visitors exist for useful matchmaking outside a seeded demo.
- Staff can keep occupancy sufficiently accurate without intrusive tracking.

### Open product decisions

1. Should a seat selection be a reservation, an advisory suggestion, or a check-in confirmation? **MVP default:** a confirmed seat claim in the app, with staff override.
2. How long should inactive or abandoned visits remain active? **MVP default:** café-configured expiry, checked against closing time.
3. Are circles fully auto-created or staff-approved? **MVP default:** AI proposes, users opt in, backend activates; staff can cancel.
4. Are existing friend pairs or repeated matches supported? **MVP default:** no social graph; minimal block history only.
5. Will the first real pilot allow anonymous use? **To determine** after trust-and-safety review.
6. What historical data or sensors would be needed for credible busy-period prediction? **Out of MVP.**

## 20. Definition of done

BrewSpace MVP is complete when a customer can use one conversational entry point to (1) establish an intention, (2) choose a suitable available seat, (3) spend time in protected focus mode, (4) become discoverable only with consent and valid availability, (5) accept a mutual connection or Coffee Circle, and (6) receive correct coordinated updates when the café environment changes—without repeating their preferences or creating inconsistent state.

**North-star experience:** BrewSpace adapts the café to the customer, not the other way around.
