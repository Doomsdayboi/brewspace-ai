# BrewSpace AI — Detailed Information Architecture

**Tagline:** Your café. Your space. Your people.  
**Version:** IA 1.0 — proposed design specification  
**Date:** 22 November 2026  
**Status:** Ready for UX wireframing and frontend planning; subject to product sign-off  
**Source:** *BrewSpace AI — Product Requirements Document v1.0* (22 November 2026)  
**Intended audience:** Product, UX/UI, frontend, backend, QA, and hackathon demo team

> **Design thesis:** Structure the experience around **one active café visit**, not around three separate tools. Café Flow (space), Café Connect (people), and Coffee Circles (groups) remain independently accessible, while a persistent AI companion and shared Visit Context coordinate the customer's journey.

> **Scope note:** Requirements and priority labels are taken from the PRD. Navigation labels, proposed routes, screen IDs, layouts, copy, and interaction patterns below are **IA design proposals**, not additional approved PRD commitments. Items marked **P1** or **P2** should not delay the P0 hackathon MVP.

---

## 1. Purpose, scope, and outcomes

### 1.1 Why this document exists

The PRD explains what BrewSpace must do. This IA explains **where information lives, how users find it, how screens relate, how interactions transition between modules, and what each screen must communicate**. It is the bridge between product requirements and wireframes, interaction design, component design, and test cases.

### 1.2 In scope

- The end-to-end customer experience: QR entry, identity, intention capture, consent, visit hub, seating, focus, matching, groups, settings, and visit exit.
- The café-operator experience: occupancy, circle oversight, staff controls, and the restricted demo simulator.
- A stable, mobile-first navigation model; routes and page hierarchy; screen inventory; per-screen content and actions.
- Cross-module experience rules based on the Visit Context and visit modes.
- Content structure, naming, status language, visibility/consent boundaries, notification rules, and empty/error states.
- Accessibility, responsive behavior, deep-link handling, and IA acceptance criteria.

### 1.3 Out of scope for this IA / the hackathon MVP

Food ordering, checkout, loyalty, social feeds, public directory, direct messaging, cross-café matches, location tracking, camera occupancy, external calendar integration, live audio capture, predictive crowd forecasts, and verified professional profiles. No screen, link, or placeholder should imply these features are already available.

### 1.4 IA success criteria

1. A new visitor can express a visit goal and reach a relevant first action with minimal navigation.
2. Today shows the customer's **current visit state**, not a generic homepage or a duplicate of three module dashboards.
3. Every customer can access **My Space, Connect, and Circles** within one tap from the active-visit shell.
4. A user can remain quiet-only, social-only, or switch from focus to social without restarting onboarding.
5. “Suggested,” “Pending,” and “Confirmed” remain visually and verbally distinct.
6. Social participation is off by default; no private profile, precise seat, or contact information leaks through navigation or empty states.
7. A stale seat, declined match, or canceled circle produces a safe, recoverable state with an explicit next action.
8. The app remains usable for seat management and existing confirmed activities when Gemini is unavailable.

### 1.5 Alignment to the PRD

| IA area | Primary PRD requirements |
|---|---|
| Entry, identity, intent, consent | FR-001 through FR-006 |
| My Space and focus | FR-101 through FR-105 |
| Connect | FR-201 through FR-204; FR-205/206 P1 |
| Circles | FR-301 through FR-304; FR-305/306 P1 |
| Shared context and transitions | FR-401 through FR-403; FR-404 P1 |
| Staff console | FR-501; FR-502 P1 |

---

## 2. Core mental model and organizing principles

### 2.1 The customer mental model

Customer-facing language should answer five questions, in this order:

1. **Where am I?** — Which café and which current visit?
2. **What am I here to do?** — Focus, socialize, join a discussion, or a combination?
3. **What's happening now?** — My mode, seat, timer, upcoming meeting, or invitation.
4. **What can I do next?** — One clear contextual action, plus optional alternatives.
5. **How do I change my mind?** — Edit intention, pause discovery, change seat, leave an activity, or end visit.

**Today is the home of the visit.** My Space, Connect, and Circles provide deeper workflows. The AI assistant is a **capability available from any relevant screen**, not a separate competing source of truth.

### 2.2 Core objects, separated by meaning

| Object | Customer meaning | Owner / source of truth |
|---|---|---|
| Café | The physical venue I checked into | Café/staff configuration |
| Visit | My temporary experience in this café | Visit Service |
| Intention | What I want from this visit | Visit context; user-correctable |
| Mode | What kind of activity I'm doing now | Visit Service |
| Seat/table | A physical spot with features and availability | Flow Service |
| Seat suggestion | A recommended option, **not** a claim | Flow recommendation result |
| Seat claim | A server-confirmed assignment | Flow Service |
| Connect consent | Permission to participate in 1:1 discovery | Visit/consent controls |
| Match proposal | Possible 1:1 connection awaiting choices | Connect Service |
| Confirmed match | Both people accepted; meetup details are available | Connect Service |
| Circles consent | Separate permission for group discovery | Visit/consent controls |
| Circle proposal | Possible group activity, not guaranteed | Circles Service |
| RSVP | A customer's response to a circle invitation | Circles Service |
| Confirmed circle | Quorum and seating verified | Circles Service |
| Notification | A contextual message about an authoritative state | Event/Notification Service |

### 2.3 Rules that must always hold

- **One visit, one context.** Edits to interests, timing, mode, or consents propagate to all eligible modules.
- **Single source of truth.** UI copies authoritative server status; the assistant doesn't invent seats, people, or confirmations.
- **Intent before module choice.** Onboarding starts with the customer's goal, not a forced selection of Flow/Connect/Circles.
- **A module can be opened directly.** Social features should never require using the chatbot.
- **No silent consequential actions.** Seat claim, match acceptance, RSVP, privacy changes, and visit ending require deliberate controls.
- **Focus is quiet by design.** Suppress social interruptions during `FOCUSING`; operational-critical service updates remain possible.
- **No dead ends.** Empty and failure screens return the user to a relevant alternative, Today, or an editable preference.

---

## 3. Roles, entry points, and experience boundaries

### 3.1 Roles and primary goals

| Role | Primary surface | Core goal | Important restrictions |
|---|---|---|---|
| Focus Visitor | Customer app | Find a suitable spot and protect focus time | Not surfaced to social discovery without opt-in |
| Social Explorer | Customer app | Find mutually interested people | Private information hidden before mutual consent |
| Circle Participant | Customer app | Discover and attend a short group | RSVP is not an automatic guarantee of activation |
| Café Operator | Staff console | Keep physical/operational state accurate | No unrestricted access to private interests |
| Demo Administrator | Restricted simulator | Reproduce and reset demonstration scenarios | Never exposed to ordinary customers |

A single customer can act as any combination of the first three roles **within one visit**. These are behavioral personas, not separate account types.

### 3.2 Entry points

| Entry | Destination | Behavior |
|---|---|---|
| Café QR code | Café Welcome | Preselect café; do not expose visitor socially |
| Reload while active | Today / resume checkpoint | Restore server-backed visit and in-progress actions |
| Deep link to seat | Seat details, after café/visit validation | Do not show unavailable or unauthorized data |
| Deep link to Connect proposal | Proposal details, after authentication/eligibility | Respect consent and expiration |
| Deep link to circle | Circle details, after authorization | Show canceled or full state honestly |
| Operator sign-in | Staff console | Role/café authorization required |
| Simulator shortcut | Demo admin | Restricted to seeded testing environment |

### 3.3 Active visit boundaries

A customer has at most one active visit per café. Changing cafés or following a link for another café must present a clear venue mismatch and a safe way to end/switch visits, not silently move them. The MVP does **not** support cross-café social discovery.

---

## 4. Navigation architecture

### 4.1 Global customer shell

**Recommended mobile shell (P0):**

- **Top contextual header:** BrewSpace wordmark, current café name, optional status indicator, and Notifications/More access.
- **Primary bottom navigation:** **Today · My Space · Connect · Circles**. Display clear text labels with icons; don't rely on icons alone.
- **Settings:** accessible via the top-right **More/Settings** menu and from privacy-related contextual links. This retains the five PRD information areas while keeping four high-frequency tabs visible on narrow screens. If team testing supports five tabs comfortably, a five-tab alternative is acceptable.
- **Persistent AI entry:** a visible **Ask BrewSpace** control on Today and module pages; opens an assistant sheet or panel without discarding the underlying screen.
- **Transient system status:** toast/banner for seat availability changes, accepted invites, circle relocation, and AI fallback.

**Recommendation:** The bottom navigation should only appear **after** a visit is created. Onboarding uses a linear flow with a back action and clear progress; don't display irrelevant social destinations before consents are set.

### 4.2 Tab definitions

| Destination | Label | Job-to-be-done | Default content | Relevant modes |
|---|---|---|---|---|
| Visit hub | Today | Understand and manage this visit | Current mode, seat, next step, AI input | All active modes |
| Space module | My Space | Find, confirm, and manage a spot | Seat map/list, current claim, focus control | All active modes |
| Matching module | Connect | Opt into and manage 1:1 interactions | Consent gate or proposals/requests | Planning, Available, Focusing (read-only queue), Connection |
| Group module | Circles | Explore and manage group experiences | Consent gate or circle feed/my circle | Planning, Available, Focusing (read-only queue), Circle |

### 4.3 Navigation levels

- **Level 0 — Outside visit:** QR welcome, identity, initial goal and consent.
- **Level 1 — Visit shell:** Today, My Space, Connect, Circles, Settings access, assistant entry.
- **Level 2 — Module views:** map, suggestions, invites, circle feed, current visit preferences.
- **Level 3 — Details/actions:** individual seat, match proposal, specific circle, confirmation step.
- **Level 4 — Transactional or safety overlays:** confirm/cancel, retry, consent explanation, report/block, expiry notice.

A deeper destination must have **one obvious return path** and preserve the parent tab. Avoid modal-on-modal stacks.

### 4.4 Global navigation rules

1. The selected tab persists while viewing that tab's details; a new tab resets to its root unless a prior view is explicitly preserved.
2. Returning to Today must never discard an in-progress visit or confirmed action.
3. Opening the assistant should retain the current screen context and offer both **Apply** and **Dismiss** for any recommended change.
4. Routes representing old visits must fail gracefully to a completed/expired state; they must not resurrect activity.
5. A direct link to a social screen must pass consent and authorization checks **before showing private information**.
6. A pending server action should not be shown as complete because the page changed or the assistant said so.

### 4.5 Desktop and tablet adaptation

- **Phone:** four-tab bottom navigation; assistant in a sheet; full-screen details.
- **Tablet:** left navigation rail; assistant as dismissible side panel; map and seat details side by side where space permits.
- **Desktop/staff:** persistent left sidebar with content area and optional contextual detail panel. Customer UI remains available on desktop but is designed mobile-first.

---

## 5. Hierarchical sitemap

```text
BrewSpace
├── Public / Pre-visit
│   ├── QR Landing / Café Welcome [E01]
│   ├── Guest Identity / Resume [E02]
│   ├── Tell Us Your Plan [E03]
│   ├── Review & Edit AI Interpretation [E04]
│   ├── Choose Social Permissions [E05]
│   └── Your Suggested Visit Plan [E06]
│
├── Active Visit Shell
│   ├── Today [T01]
│   │   ├── Ask BrewSpace Assistant [G01, contextual]
│   │   ├── Visit Overview / Edit Intention [T02]
│   │   ├── Notifications / Activity [G02]
│   │   └── Quick Action / Next Recommended Step
│   │
│   ├── My Space — Café Flow [F01]
│   │   ├── Seat Map + List / Filters [F01]
│   │   ├── Seat Details / Reasons [F02]
│   │   ├── Confirm Seat / Conflict Recovery [F03]
│   │   └── Focus Session / Timer [F04]
│   │
│   ├── Connect — Café Connect [C01]
│   │   ├── Consent Gate / Interests [C01]
│   │   ├── Suggested Connections [C02]
│   │   ├── Anonymous Proposal / Request [C03]
│   │   ├── Pending Invites [C04]
│   │   ├── Confirmed Connection [C05]
│   │   └── Block / Report [C06, P1]
│   │
│   ├── Circles — Coffee Circles [R01]
│   │   ├── Consent Gate / Topics [R01]
│   │   ├── Discover Available Circles [R02]
│   │   ├── Circle Detail / RSVP [R03]
│   │   ├── My Circle / Meetup Details [R04]
│   │   ├── Change / Cancellation [R05]
│   │   └── Session Feedback [R06, P1]
│   │
│   └── Settings [S01]
│       ├── Visit Goals & Availability [S02]
│       ├── Social & Privacy Controls [S03]
│       ├── Blocked / Safety Controls [S04, P1]
│       └── End Visit / Confirmation [S05]
│
├── Post-visit
│   └── Visit Ended / Expired [X01]
│
└── Restricted Staff / Demo
    ├── Staff Sign-in / Role Gate [O00]
    ├── Operations Overview [O01]
    ├── Seat & Zone Management [O02]
    ├── Circles Monitor [O03]
    ├── Reports / Safety Queue [O04, P1]
    └── Demo Simulator / Seed Controls [D01]
```

**Interpretation:** Tree nesting communicates where a screen is reached from, not who owns its backend data. For example, a circle's group seating is assigned by the Circles workflow using the Flow Service; it remains presented within **Circles**, not as a confusing second seat-claim flow.

---

## 6. Route and screen registry

Routes are **proposed frontend conventions**, not dictated by the PRD. All internal IDs, membership, and permissions must be verified by the backend, even if a URL is guessed.

### 6.1 Customer and entry routes

| ID | View / Route proposal | Layer | MVP priority | Entry / purpose |
|---|---|---|---|---|
| E01 | `/c/:cafeId` | Public | P0 | Café QR landing |
| E02 | `/c/:cafeId/welcome` | Onboarding | P0 | Guest alias or resume session |
| E03 | `/visit/setup/intent` | Onboarding | P0 | Natural-language visit request |
| E04 | `/visit/setup/review` | Onboarding | P0 | Correct Gemini interpretation |
| E05 | `/visit/setup/consent` | Onboarding | P0 | Separate Connect/Circles opt-ins |
| E06 | `/visit/setup/plan` | Onboarding | P0 | First recommended action |
| T01 | `/visit/today` | Main tab | P0 | Unified visit hub |
| T02 | `/visit/preferences` | Detail | P0 | Edit current visit intent / timing |
| G01 | Assistant sheet/panel | Global overlay | P0 | Contextual AI input and proposals |
| G02 | `/visit/activity` | Utility | P1 | Activity and notifications history |
| F01 | `/visit/space` | Main tab | P0 | Seat map/list |
| F02 | `/visit/space/seats/:seatId` | Detail | P0 | Seat attributes and explanation |
| F03 | Seat confirm/conflict sheet | Transactional | P0 | Confirm/retry atomic seat claim |
| F04 | `/visit/space/focus` | Detail | P0 | Focus timer and finish/extend |
| C01 | `/visit/connect` | Main tab | P0 | Consent gate or overview |
| C02 | `/visit/connect/suggestions` | Detail | P0 | Eligible anonymized candidates |
| C03 | `/visit/connect/matches/:matchId` | Detail | P0 | Proposal, accept/decline |
| C04 | `/visit/connect/invitations` | Detail | P0 | Pending requests; same source as C03 |
| C05 | `/visit/connect/matches/:matchId/meeting` | Detail | P0 | Confirmed meetup instructions |
| C06 | Block/report action sheet | Overlay | P1 | Safety action |
| R01 | `/visit/circles` | Main tab | P0 | Consent gate or discovery overview |
| R02 | `/visit/circles/discover` | Detail | P0 | Proposed/available group activities |
| R03 | `/visit/circles/:circleId` | Detail | P0 | Topic, RSVP, quorum, venue status |
| R04 | `/visit/circles/:circleId/my-session` | Detail | P0 | Confirmed circle and prompts |
| R05 | Circle-change banner/sheet | Transactional | P0 | Reassignment, cancellation, expiry |
| R06 | `/visit/circles/:circleId/feedback` | Detail | P1 | Optional post-session feedback |
| S01 | `/visit/settings` | Utility | P0 | Visit, consent and account controls |
| S02 | `/visit/settings/visit` | Detail | P0 | Goals, timing, quiet preference |
| S03 | `/visit/settings/privacy` | Detail | P0 | Separate discovery toggles |
| S04 | `/visit/settings/safety` | Detail | P1 | Blocks, reports, safety resources |
| S05 | End-visit confirmation sheet | Transactional | P0 | Clear exit consequences |
| X01 | `/visit/ended` | Post-visit | P0 | Closed or expired visit |

### 6.2 Restricted operations routes

| ID | View / Route proposal | Priority | Scope |
|---|---|---|---|
| O00 | `/staff/login` | P0 | Authentication and staff role gate |
| O01 | `/staff/:cafeId/overview` | P0 | Occupancy summary, active circles |
| O02 | `/staff/:cafeId/seats` | P0 | Seat status updates, live map |
| O03 | `/staff/:cafeId/circles` | P0 | View circles, table assignments |
| O04 | `/staff/:cafeId/reports` | P1 | Restricted safety reports and actions |
| D01 | `/demo/:cafeId/simulator` | P0 demo-only | Seed/reset customers, trigger occupancy/events |

**Route policy:** Keep internal visit identity server-bound (session/auth) rather than trusting a `visitId` embedded in the route. Explicit IDs in match and circle URLs are locators only; they are not proof of authorization.

---

## 7. Screen specifications — pre-visit and onboarding

### E01 — Café Welcome / QR landing [P0]

**Goal:** Establish venue context and reassure the visitor that scanning the QR has not made them socially visible.

- **Primary content:** Café name, BrewSpace value proposition, short privacy statement (“You decide whether to connect”), **Start my visit**, optional **Resume visit**.
- **Primary action:** Start; secondary: read how it works, change venue only if permitted.
- **State:** Unrecognized café → clear “This café link is unavailable” with safe retry; existing active visit → present **Resume** instead of creating another.
- **Exit:** E02. **Do not:** show people lists, public seat identities, or implied nearby users.

### E02 — Guest identity / session recovery [P0]

**Goal:** Get a lightweight usable identity without premature friction.

- **Primary content:** Optional display alias, anonymous/guest session note, café name; explain alias visibility only after mutual acceptance where applicable.
- **Actions:** Continue; resume securely if a session exists; retry identity creation on failure.
- **State:** Authentication pending; expired previous session; blocked or unsupported guest session.
- **Exit:** E03 for new session, T01 for a valid resumable visit.

### E03 — Tell us your plan [P0]

**Goal:** Capture intention in the customer's language, before requiring module knowledge.

- **Primary content:** Prompt such as **“What would you like from your café visit?”**; examples (“Quiet work for an hour”; “Meet people who love books”; “Work first, socialize afterward”).
- **Form:** Multiline natural-language input; **Build my plan** action; optional quick-start chips as input helpers, not required categories.
- **System behavior:** Gemini extracts intent, approximate time, preferred seat attributes, interests, and desired availability. Show processing state without freezing navigation.
- **Fallback:** If AI fails, use guided fields for purpose, duration, required seat features, and interests.
- **Exit:** E04. **Do not:** automatically turn on Connect or Circles because the user mentioned meeting people.

### E04 — Review and edit interpretation [P0]

**Goal:** Make AI-derived assumptions inspectable and correctable.

- **Primary content:** Cards/fields for **My plan**, **How long I'm staying**, **Seating needs**, **Interests**, **When I'm available to talk**.
- **Actions:** Edit any field; **Looks right**; **Try different wording**.
- **System behavior:** User edits override generated values and immediately update Visit Context. Unknown duration remains **Not set**, not guessed.
- **State:** Ambiguous time requires clarification; extraction failure uses manual input; unsupported request is described plainly.
- **Exit:** E05.

### E05 — Social permissions [P0]

**Goal:** Collect meaningful independent consent before discovery.

- **Primary content:** Two separate **off-by-default** controls: **Allow 1:1 connection suggestions** (Connect); **Allow group circle suggestions** (Circles).
- **Explanation per control:** What can be used (interests, availability), what stays private, and how to withdraw consent.
- **Actions:** **Continue with these choices**, **Skip social features**.
- **Rules:** Focus preference does not imply consent. Choosing one never auto-enables the other; no deceptive disabled buttons or prechecked permissions.
- **Exit:** E06.

### E06 — Your visit plan [P0]

**Goal:** Translate intent into immediate, optional concrete actions.

- **Primary content:** Current café, visit duration/mode, “Recommended now” (e.g. quiet seat), “Later if you choose” (social suggestions), and one next-step CTA.
- **Actions:** **Find my seat**, **Explore connections**, **Explore circles**, **Go to Today** depending on consent and intent.
- **State:** No suitable seat or no eligible social activity → display candid empty outcome with alternative; don't fabricate a plan.
- **Exit:** T01 or relevant F/C/R tab; preserve visit context.

**Onboarding completion rule:** A usable visit exists once the server has accepted identity, basic intention (or consciously skipped specifics), and consent settings. An AI parse failure must not block the visitor indefinitely.

---

## 8. Screen specifications — Today and global utilities

### T01 — Today: unified visit hub [P0]

**Purpose:** The first screen after setup and the permanent center of the experience.

**Information priority (top to bottom):**

1. **Visit identity:** café name; active/inactive state; easy access to end visit.
2. **Now card:** actual `currentMode` in customer language (“Focusing”, “Available to connect”, “In a circle”), remaining focus time if relevant.
3. **Current commitment:** confirmed seat and/or accepted meetup; clearly distinct from suggestions.
4. **Next best action:** a single context-aware card with reason, timing, and explicit CTA; user can dismiss.
5. **Your plan:** brief timeline (e.g., focus now, available to socialize after 5 PM), with edit link.
6. **Quick entry:** My Space, Connect, Circles (not duplicated full module dashboards).
7. **AI input:** “Ask BrewSpace…” with examples grounded in current state.

**Mode-specific logic:**

| Mode | Primary message | Primary action | Suppressed/secondary content |
|---|---|---|---|
| `PLANNING` | Finish setting up this visit | Review plan / find seat | Social prompts require opt-in |
| `FOCUSING` | Focus session active, time remaining | Finish / extend focus | No proactive social invitation cards |
| `AVAILABLE` | Free to explore; consents shown accurately | Explore relevant match or circle | Don't imply opt-in if disabled |
| `IN_CONNECTION` | Confirmed 1:1 meeting details | View meeting / finish | Avoid overlapping circle acceptance |
| `IN_CIRCLE` | Active circle and location | View circle | Avoid other meeting commitments |
| `ENDED` | Visit complete | Start new visit | Never show live recommendations |

**Today acceptance:** A customer can identify their mode, whether a seat is actually confirmed, whether social discovery is enabled, and their next action without interpreting AI prose.

### T02 — Edit visit goals and timing [P0]

- **Content:** Editable intents, interests, seat needs, planned departure, focus end, available social windows.
- **Actions:** Save changes; cancel; reset AI-suggested values; optional **Describe a change** through assistant.
- **Consequences:** Warn when timing edits invalidate a pending invitation or confirmed future commitment; don't silently cancel confirmed activities.
- **Feedback:** Show **Updated** after server acknowledgement; relevant module summaries refresh.

### G01 — Persistent assistant [P0]

**Pattern:** Bottom sheet on mobile, side panel on wider layouts. Does not replace Today or force module navigation.

- **Header:** “Ask BrewSpace” and context (“For your visit at [café]”).
- **Conversation:** User message, brief interpretation, grounded results, next actions; no unnecessarily long assistant monologues.
- **Tool result cards:** Seat suggestions, match proposal, circle invitation, or visit-preference changes; each includes authoritative status and appropriate CTA.
- **Confirmation boundary:** “I can suggest seat Q3” is different from “Q3 is confirmed”; seat claim requires explicit **Confirm seat** and successful backend response.
- **Error:** AI unavailable → “You can still use My Space, Connect, and Circles directly.” Link to manual actions.
- **Privacy:** Assistant should not display private data about nonconsenting users or invent people/availability.

### G02 — Notifications / activity [P1 screen; P0 minimal in-app banners]

- **Buckets:** **Needs your response**, **Confirmed updates**, **Earlier activity**.
- **Items:** invitation received, match accepted, circle activated, seat relocated, circle canceled, visit expiry reminder.
- **Actions:** Open owning module; dismiss informational item; no destructive action via toast.
- **Priority:** Operational/safety > time-sensitive confirmations > social discovery. In `FOCUSING`, noncritical social cards remain in the owning module rather than popping up.
- **MVP shortcut:** Use an in-app notification badge and module-specific inline messages; defer historical activity feed.

---

## 9. Screen specifications — My Space / Café Flow

### F01 — My Space overview and seat map [P0]

**Purpose:** Visualize available places and help the customer select a suitable physical space.

- **Header summary:** Confirmed seat (if any), zone, current focus status, and **Change seat** action.
- **Primary content:** Digital floor map with distinct seat states; list alternative for accessibility; zone chips **Quiet, General, Social, Group**; filters for outlet and capacity.
- **Recommendation area:** Up to three ranked available suggestions, each with reasons tied to known seat attributes.
- **Actions:** View details, apply filters, choose a recommended seat, start/finish focus.
- **Visual rule:** An unclaimed suggestion must never look like a confirmed assignment. Use both text and visual cues—not color alone.
- **Empty state:** “No quiet seats with outlets are available right now” with **See other suitable seats** / **Edit seating needs**.
- **Realtime:** Invalidate stale recommendations when staff or customer updates change status. Screen-reader status announcement should indicate availability changes.

### F02 — Seat details [P0]

- **Primary content:** Seat ID; zone; capacity; outlet availability; confirmed live status; concise suitability explanation; optional mini-map location.
- **Actions:** **Confirm this seat** (only while available), **Back to options**, **Change preferences**.
- **Restrictions:** Do not show who occupies an unavailable seat. Group-table assignment for circles is managed through circle workflow and not open to double claim.
- **State:** `Available`, `Unavailable`, `Checking availability`; backend is authoritative.

### F03 — Seat confirmation and conflict recovery [P0]

- **Before commit:** Confirmation sheet reiterates seat and short reason; user clicks **Confirm**.
- **Pending:** Disable duplicate submits and say **Checking this seat…**.
- **Success:** “Seat Q3 confirmed” with action to **Start focus** or **Return to Today**.
- **Conflict:** “Q3 was just taken” with refreshed alternative seats; never retain a false success state.
- **Other failure:** Network unavailable → **Try again**; re-fetch server state after reconnection.

### F04 — Focus session [P0]

- **Primary content:** Focus countdown (if time was supplied), current seat, quiet status, planned end time, concise notice that social invitations are paused.
- **Actions:** **Finish focus**, **Extend focus**, **Change seat**.
- **Timed behavior:** Reaching scheduled end should prompt or transition according to the agreed product policy, but avoid surprising social disclosure or notification spam. **Proposed IA default:** mark availability at end and present a calm, nonintrusive “Ready for what's next?” state; do not auto-enable social consents.
- **Exit:** Return to Today with updated mode and new eligible suggestions.

**Special case:** If seat status changes due to staff override, display a high-priority operational alert and a safe relocation path even while focus is active.

---

## 10. Screen specifications — Connect / Café Connect

### C01 — Connect overview and opt-in gate [P0]

- **Opted out:** Clear explanation; **Enable Connect** action; benefits and privacy limits; optional interest editing.
- **Opted in:** Status “Discovery on”, interest tags, declared available time, simple pause/off control, entry to suggestions and invitations.
- **While focusing:** Clearly state **“Suggestions will be held until your focus session ends”**; do not expose match teasers as interruptive banners.
- **While busy:** Show the active meeting and that new overlapping commitments are unavailable.
- **Always accessible:** Explicit opt-out, edit interests, edit availability.

### C02 — Suggested connections [P0]

- **Card content:** Anonymous or generic display, consent-safe shared interests, mutual intent compatibility, approximate proposed window, short reason.
- **Actions:** **Interested**, **Not now**, **Edit what I'm looking for**.
- **Ranking:** Only eligible candidates from Connect Service; do not sort with private information in client state.
- **Privacy:** Before both accept, never reveal the person's exact seat, full identity, contact details, or private notes.
- **Empty:** Distinguish **Discovery off**, **No eligible people now**, **You're focusing**, **No overlapping time**, and **Network unavailable**; each has a useful next action.

### C03 — Match proposal and response [P0]

- **Content:** Shared interests/goal, approximate availability window, current proposal status, consent/privacy reminder.
- **Actions:** **Accept** / **Decline** for recipient; **Cancel request** for sender when pending.
- **Outcome messaging:** “Waiting for the other person” versus “Both agreed”; only then reveal allowed display alias and meetup instructions.
- **Expiry:** Show “This invitation expired” without exposing a hidden identity; offer new suggestions.
- **Focus rule:** Incoming proposals do not interrupt a focus session; stale offers are revalidated after focus ends.

### C04 — Pending invitations [P0]

- **Buckets:** **Invitations to respond to**, **Waiting for response**, **Confirmed**.
- **Default order:** Incoming actionable first, then outgoing pending; time-bound first within each group.
- **Actions:** Open C03, decline/cancel, view C05 after mutual acceptance.
- **Risk rule:** A stale or revoked consent immediately removes actionable controls, even if a previously cached card remains briefly visible.

### C05 — Confirmed connection [P0]

- **Content:** Both-accepted status, consented alias, shared topic summary, time and public-designated meeting area or staff-approved instructions.
- **Actions:** **I'm ready**, **Cancel meetup**, **Return to Today**. P1: **Finish meetup**, **Block/report**, **Optional conversation starter**.
- **Collision handling:** The meeting cannot overlap with a confirmed circle. If availability changes, require explicit conflict resolution, not silent reassignment.
- **Physical safety:** Don't reveal another person's current exact seat merely because they are matched; show only agreed meeting instructions.

### C06 — Block and report [P1 safety view; immediate safety path recommended for pilots]

- **Entry:** Confirmed connection or contextual action; access should not require returning to Today.
- **Actions:** Block future discovery; report conduct with minimal required details; cancel active connection if necessary.
- **Feedback:** Acknowledge the request and show status without promising instant human review.
- **Staff visibility:** Reports are restricted; reasons are not shown to other customers.

---

## 11. Screen specifications — Circles / Coffee Circles

### R01 — Circles overview and opt-in gate [P0]

- **Opted out:** Explanation and **Enable Circles**; separate from Connect permission.
- **Opted in:** Suggested circles, **My circle** if pending or confirmed, quick link to adjust topics and availability.
- **While focusing:** Show a quiet state and allow voluntary browsing, but no proactive social alert.
- **Primary idea:** A circle is a timed, public café group—not a chat room or persistent social feed.

### R02 — Discover circles [P0]

- **Content per card:** Topic/title, short description, proposed or confirmed time, estimated duration (default 20 minutes), interested/confirmed participant count, available spots where known, group status, and reason it matches interests.
- **Sort order:** Confirmed or near-term eligible circles, then relevant proposed circles; avoid showing a full group as joinable.
- **Filters (optional):** Topic, time window, **My interests**, **Starting soon**.
- **Actions:** View details, respond to an invitation, adjust topics.
- **Empty:** “No compatible circles right now”; explain uncertainty and offer **Browse later**, **Edit interests**, or **Explore My Space**.

### R03 — Circle detail, RSVP, and formation [P0]

- **Content:** Topic, 20-minute duration default, time window, group range (3–6), status, participation count, general zone, inclusion guidance, and **Join circle** only if eligible.
- **States:** **Proposed**, **Awaiting confirmations**, **Confirmed**, **Full**, **Rescheduled**, **Canceled**, **Completed**. A participant's RSVP status is displayed separately.
- **Actions:** **Join**, **Decline**, **Cancel my RSVP**; optional **Suggest another time** P1.
- **Critical boundary:** Joining is an RSVP, not proof the circle will happen. Confirmation requires at least three accepted participants and an available held group table.
- **Privacy:** Before activation, show counts and topic—not nonconsenting members' identities or exact seating.

### R04 — My circle / live experience [P0]

- **Content:** Confirmed topic, time, designated group table/meeting area, participation status, optional 2–3 Gemini-generated conversation starters, visible change notices.
- **Actions:** **View meeting location**, **Leave circle**, **Return to Today**; P1: **Complete session**, **Feedback**.
- **Restrictions:** Do not pretend the app listens to or moderates the physical discussion.
- **While in circle:** Today highlights the current circle and blocks accepting overlapping 1:1 commitments.

### R05 — Circle change and conflict resolution [P0]

- **Triggers:** Table becomes unavailable; quorum drops; RSVP expires; circle canceled or rescheduled.
- **Required content:** What changed, what remains confirmed, the new location/time if authorized, and what the customer should do.
- **Actions:** **View updated circle**, **See alternatives**, **Leave circle**, depending on status.
- **Reassignment:** Only show a new table after server confirmation. If no suitable table exists, state that the circle cannot continue as planned.

### R06 — Post-circle feedback [P1]

- **Content:** Short optional questions (“Was the topic relevant?”; “Was the venue suitable?”), no recording of participants' discussion.
- **Actions:** Submit, skip, report concern.
- **Data:** Aggregate experience feedback; avoid sharing private responses with other attendees.

---

## 12. Settings, visit exit, and staff views

### S01 — Settings hub [P0]

- **Groups:** **This visit**, **Social preferences**, **Privacy and consent**, **Help and safety** (P1 advanced), **End visit**.
- **Content:** Café, alias, visit status, visible consent toggles or clear links.
- **Rules:** Settings are not a second profile-setup wizard. Changes should update the active visit without rerunning onboarding.

### S02 — Visit goals and availability [P0]

- **Fields:** Intent, planned departure, focus-until, acceptable social windows, seat requirements, interest tags.
- **Actions:** Save, cancel, reset fields, return to Today.
- **Side effects:** Changing availability recomputes match and circle eligibility; warn before invalidating an accepted future meeting.

### S03 — Social and privacy controls [P0]

- **Controls:** **Connect discovery [off/on]**, **Circle discovery [off/on]**, **Pause for this visit** (optional P1), edit consented interests and timing.
- **Explanations:** Audience, duration, and visibility for each consent; opt-out effect begins immediately server-side.
- **Caution:** Opting out stops new discovery, but does not silently erase an already accepted commitment; the UI should offer to cancel it explicitly and explain who is notified.

### S04 — Safety center [P1]

- **Content:** Blocked profiles (if applicable), reporting help, cancellation and contact-sharing guidance.
- **Permissions:** Only own report history and block list; never another customer's report details.

### S05 — End visit confirmation [P0]

- **Content:** “Ending your visit removes you from active discovery and closes your current session. Confirmed commitments may be canceled.”
- **Actions:** **End visit**, **Keep my visit active**.
- **Result:** Server transitions to `ENDED`, clears live eligibility, releases applicable claims/holds, and opens X01. No optimistic completion before success.

### X01 — Visit ended / expired [P0]

- **Content:** Clear ended/expired status, optional brief visit summary using own data only, privacy statement, **Start a new visit**.
- **Do not:** Show live people/seat information, or make expired links look usable.

### O00–O03 — Operator console [P0]

- **O00 Staff access:** sign-in, authorized café selection, denied-access state.
- **O01 Operations overview:** current occupied/available seats, active circles, operational alerts, simple access to map.
- **O02 Seat management:** floor inventory with zone, capacity, features, occupancy; authorized change status; conflict warning; live propagation.
- **O03 Circle monitoring:** proposed/confirmed/active/canceled groups, quorum, assigned group table, ability to view conflict and resolved location. P1 operator-created circles and cancellation controls.
- **Boundary:** Staff sees operationally necessary data and aggregate counts, not a public list of customer interests or unaccepted match details.

### O04 — Reports and safety [P1]

Restricted report queue with status, necessary details, escalation/closure actions, and audit trail. No access to customers; demo administrators cannot use this as a general-purpose directory.

### D01 — Hackathon simulator [P0 demo-only]

Seed four consenting customer identities, choose predefined interests and availability, mark table states, trigger focus-ended and table-conflict events, and reset all demo data. Label the environment **Demo / Simulated** prominently. The simulator is not a customer feature and should never be accessible in a production café tenant without administrative authorization.

---

## 13. Cross-module user journeys and interaction flows

### J01 — Hero journey: Focus → Connect → Circle [P0]

```text
QR scan → E01 → E02 → E03: “Work quietly for 60 minutes,
                              then meet people interested in AI.”
        → E04: correct interpretation and time window
        → E05: independently enable Connect and Circles
        → E06: plan preview
        → F01/F02/F03: choose and confirm quiet seat Q3
        → F04: focus starts; Today = FOCUSING
        → [no proactive social interruption]
        → F04: Finish focus
        → Today = AVAILABLE; assistant suggests valid options
        ├── C02/C03: interest-based 1:1 proposal → mutual acceptance
        └── R02/R03: AI Builders Circle → RSVP → quorum + table
                                           → R04 confirmed group
        → Staff changes group table status
        → R05: updated confirmed location, or safe cancel/reschedule
        → S05: end visit → X01
```

**Acceptance:** No re-onboarding; no social disclosure before consent; no invitation during focus; circle table remains authoritative after change.

### J02 — Quiet-only visitor [P0]

E03: quiet work → E05: both social controls remain off → F01: seat suggestions → F03: confirm → F04: focus → Today. Connect and Circles tabs remain accessible but show explicit off-state gates, not unauthorized suggestions. End visit when done.

### J03 — Social-only visitor [P0]

E03: “Meet someone interested in books for 25 minutes” → E04: parse window → E05: enable Connect only or Circles separately → Today = AVAILABLE → C02 candidate or R02 group if eligible. If none, show truthful empty state and alternative action. Never fabricate attendees.

### J04 — Two customers claim one seat [P0]

Both view F02 while seat status is available → both confirm F03 → backend transaction accepts only one → loser sees **Seat no longer available** → refreshed F01 suggestions → return to Today if they prefer. No lingering optimistic success card.

### J05 — Match consent withdrawn mid-invitation [P0]

One customer has a pending request → user disables Connect in S03 → Connect Service revokes new eligibility and actionable proposal → other customer sees **No longer available** without identity disclosure → returned user remains in their seat/focus state.

### J06 — Circle loses table or quorum [P0]

Customer RSVPs → circle not yet confirmed → table becomes unavailable or accepted count falls below 3 → backend checks alternate confirmed group table and viable quorum → R05 shows confirmed relocation if successful; otherwise proposed/rescheduled/canceled. Never imply “confirmed” without both quorum and seating.

### J07 — User changes their mind mid-visit [P0]

User opens assistant from Today: “I need another 30 minutes of quiet work.” Assistant proposes a new focus duration → user applies change → T02/Visit Service updates context → notifications respect FOCUSING → Connect/Circles eligibility is recomputed for the new window. Existing confirmed obligations require explicit conflict resolution.

### J08 — AI unavailable [P0]

E03 or G01 AI request fails → inline fallback asks for manual intention/preferences → Today and direct tabs work → F01 reads authoritative seats; C01 manages consent; R02 lists current eligible circles. Confirmations depend on backend state, not AI availability.

### J09 — Visit expiry / switch cafés [P0]

Inactive/expired visit → any old deep link resolves to X01 or a safe sign-in/resume gate; live membership actions are disabled. A QR code for a different café warns about the current active visit and asks the user to close or switch deliberately.

### J10 — Staff resolves a conflict [P0]

O02 updates group table to unavailable → authoritative event updates Circles Service → alternate group seating is checked → accepted participants receive a single deduplicated operational update in R05 / Today, including focus users when necessary to avoid an unsafe meeting instruction.

---

## 14. Visit modes, object states, and cross-module transitions

### 14.1 Canonical visit modes from the PRD

| Server mode | Customer label | Home focus | Allowed actions | Proactive social suggestions |
|---|---|---|---|---|
| `PLANNING` | Planning my visit | Finish setup and first action | Edit plan, choose seat, set consent | None until consent and eligible |
| `FOCUSING` | Focusing | Timer and quiet seating | Extend/finish focus, manage seat, edit preferences | Suppressed |
| `AVAILABLE` | Available | Next appropriate activity | View eligible matches/circles, edit plan | Allowed only for relevant opted-in module |
| `IN_CONNECTION` | In a connection | Confirmed meetup | View agreed instructions, cancel/finish as supported | Avoid conflicting proposals |
| `IN_CIRCLE` | In a Coffee Circle | Active group and location | View prompts, leave, see updates | Avoid conflicting proposals |
| `ENDED` | Visit ended | Closure | Start new visit | Never |

**Important:** Mode and consent are independent. `AVAILABLE` does **not** mean social discovery is automatically on. `FOCUSING` does not erase an existing opt-in; it suppresses delivery and changes eligibility/availability handling.

### 14.2 UI status vocabulary for commitments

| UI state | Meaning | Example language | Must not claim |
|---|---|---|---|
| Suggested | Recommended possibility | “Q3 could fit your needs” | Guaranteed seat |
| Pending | Customer action submitted; awaiting server/other people | “Waiting for Sam to accept” | Fully booked meetup |
| Confirmed | Server validated all required conditions | “Q3 is confirmed”; “Circle confirmed” | Anything that the server hasn't checked |
| Changed | Prior state replaced by a new authorized outcome | “Your circle moved to G2” | Silent relocation |
| Unavailable | Action can't proceed | “This seat was just taken” | Suggesting it remains selectable |
| Expired | Validity window passed | “This invitation expired” | Usable RSVP |
| Canceled | Commitment was explicitly stopped | “The circle was canceled” | Hidden attendance |
| Completed | Event or visit ended normally | “Your visit has ended” | Continued live eligibility |

### 14.3 Match lifecycle (UI projection)

`Suggested (private teaser) → Invitation pending → Accepted by one / awaiting other → Mutually confirmed → In connection → Completed`, with branches to `Declined`, `Expired`, `Canceled`, or `Blocked`. Only mutual acceptance unlocks consented alias and agreed meetup details. These status labels are a UI projection of Connect Service's backend states.

### 14.4 Circle lifecycle (UI projection)

`Suggested / Proposed → RSVP pending or accepted → Quorum + table validated → Confirmed → Active → Completed`, with branches to `Full`, `Rescheduled`, `Canceled`, `Expired`, or `Left`. The RSVP status is **separate** from the circle status: *my RSVP accepted* is not the same as *circle confirmed*.

### 14.5 State transition rules

- **Focus ends:** update Visit Context, recompute availability and eligibility, surface only consent-allowed suggestions.
- **Focus extends:** suppress new social prompts and revalidate relevant pending offers; warn if an accepted commitment would conflict.
- **Seat changes:** My Space and Today update; a group table change also updates its circle participants.
- **Match mutually accepted:** disable conflicting overlap commitments; Today highlights meetup.
- **Circle confirmed:** show meeting table and time only after seating/quorum verification; avoid concurrent 1:1 bookings.
- **Consent removed:** immediately stop new discovery in that module and revoke pending eligible proposals; explain effects on accepted commitments.
- **Visit ended:** remove from all live eligibility, stop notifications, release applicable claims and holds, retain only permitted history.

---

## 15. Content architecture and taxonomy

### 15.1 Naming conventions

| Concept | Preferred customer label | Avoid |
|---|---|---|
| Overall visit hub | Today | Dashboard, Portal, Agent Home |
| Flow module | My Space | Seat Optimizer, Inventory |
| 1:1 module | Connect | Network Matching Engine |
| Group module | Circles | Clusters, AI Groups |
| AI entry | Ask BrewSpace | Execute Agent, LLM |
| Visit intention | What brings you here? | Intent classification |
| Confirmed seat | Your seat: Q3 | Booking processed if unconfirmed |
| Focus session | Focus time | Disable Social Engine |
| Group action | Join circle | Auto-enroll |
| Pending group | Awaiting confirmations | Reserved/confirmed |
| Personal settings | Settings | Configuration Console |

### 15.2 Labels and microcopy rules

- Use **concrete action verbs**: “Confirm seat,” “Finish focus,” “Accept invitation,” “Join circle,” “End visit.”
- Include **why** a suggestion appeared, based only on permitted information (“You both mentioned AI and are free after 5 PM”).
- Be direct about uncertainty (“This circle will happen once at least 3 people accept and a table is available”).
- Privacy statements should explain exactly **who sees what and when**; don't substitute generic “secure and private.”
- Never equate “interest overlap” with guaranteed friendship or compatibility.
- A toast may announce an outcome but the owning module must preserve the full, accessible state.

### 15.3 Content cards: minimum fields

**Seat suggestion card:** seat ID; zone; features; availability; grounded reason; view/confirm action; data freshness cue if available.

**Connect proposal card:** permitted interest overlap; approximate time window; anonymized candidate identifier; status; explicit accept/decline; expiration if relevant.

**Circle card:** topic; time; duration; participant count; min/max; state; join eligibility; general area before confirmation; clear distinction between RSVP and circle activation.

**Today next-action card:** label; owning module; reason; status; timing; CTA; dismissal or alternate link; no private data leaks.

**Operational update:** what changed; what is still valid; corrective action; timestamp if useful; source of truth in the relevant module.

---

## 16. Permissions, consent, and progressive disclosure

### 16.1 Visibility matrix

| Information | Visitor themselves | Unaccepted match candidate | Mutually accepted match | Other circle participant | Café operator |
|---|---|---|---|---|---|
| Own intent/availability | Full | — | Only mutually shared meetup window | Only shared group window | Not by default |
| Interest overlap | Full | Limited consent-safe teaser | Shared, allowed summary | Shared topic only | Not by default |
| Alias | Full | Hidden/anonymized | Displayed as agreed | Minimal alias only if explicitly provided | Only if operationally necessary |
| Exact personal seat | Full | Hidden | Hidden unless deliberately shared | Hidden | Seat occupancy status, not customer identity by default |
| Circle topic / time | Full | As applicable | As applicable | Visible to eligible invitees | Visible operationally |
| Confirmed circle group table | If participant | — | — | Visible after confirmation | Visible |
| Block/report information | Own actions | Hidden | Hidden | Hidden | Authorized report details only P1 |
| Other customers' private notes | None | None | None | None | None |

### 16.2 Consent checkpoints

1. **E05:** separate Connect/Circles opt-in, both default off.
2. **C01/R01:** contextual explanations before enabling a module later.
3. **C03:** explicit acceptance of a specific person; mutual confirmation required.
4. **R03:** explicit RSVP for a specific group, with transparent formation status.
5. **S03:** easy, immediate withdrawal of future discovery consent.
6. **S05:** end visit requires explicit confirmation of exit consequences.

### 16.3 Privacy-oriented navigation behavior

- Do not let anonymized candidate IDs, URL parameters, browser history labels, or notifications reveal protected identity details.
- Generic push/toast content before mutual acceptance (“You have a new connection invitation”) is safer than including a name.
- A user who opts out can still see the Connect/Circles tabs with a clear disabled state, rather than hidden navigation that makes opt-in management difficult.
- Distinguish **participation permission**, **invitation acceptance**, and **information-sharing permission**; one does not automatically grant the others.

---

## 17. Notifications and interruption policy

### 17.1 Priority tiers

| Tier | Examples | While focusing | Placement |
|---|---|---|---|
| Critical operational | Assigned seat no longer valid; confirmed circle relocation affecting a committed visit | Shown if action is required | Inline banner + owning module |
| Transactional | Seat confirmed; match mutually accepted; circle confirmed/canceled | Stored and shown without intrusive social prompt unless action is urgent | Today, module, optional toast |
| Discovery | “Someone may match your interests”; “New circle proposed” | Never proactively delivered | Module queue; surfaced after focus |
| Informational | Preference saved; suggestion dismissed | Nonintrusive | Inline confirmation or toast |

### 17.2 Deduplication and ordering

Events may arrive more than once. UI messages should be keyed to a stable event/entity version. If a circle moves twice, show the **latest confirmed location** and make the earlier alert obsolete; do not stack contradictory instructions. Expired notifications must not keep enabling invalid actions.

### 17.3 Notification CTA conventions

A notification always opens the **owning module** (seat → My Space; match → Connect; circle → Circles). Today may summarize it, but should not duplicate a separate action flow.

---

## 18. Empty, loading, error, and fallback states

| Screen/context | Empty or failure message | Next action |
|---|---|---|
| Café QR invalid | “This café link isn't available.” | Retry / ask staff |
| AI interpretation unclear | “I couldn't tell how long you'll stay.” | Enter duration manually |
| Gemini unavailable | “I can't build a plan right now, but you can choose directly.” | Manual form / My Space |
| No suitable seat | “No seats meet all your requirements at the moment.” | Relax filters / see others |
| Seat taken concurrently | “That seat was just taken.” | See refreshed options |
| Focus active | “You're focusing. Social suggestions will wait.” | Finish/extend focus |
| Connect off | “You're not visible for 1:1 discovery.” | Enable Connect |
| No Connect candidates | “No eligible connections right now.” | Adjust interests/time / check later |
| Match expired/withdrawn | “This invitation is no longer available.” | Browse suggestions |
| Circles off | “You're not receiving group invitations.” | Enable Circles |
| No circles | “No matching circles right now.” | Update interests / browse later |
| Circle lacks quorum | “This circle is still awaiting enough participants.” | Keep RSVP / leave |
| Circle loses table | “The meeting space changed.” / “No alternative space is available.” | View update / cancel |
| Lost connection | “Checking for the latest café status…” | Retry; disable risky commits |
| Visit expired | “Your visit has ended.” | Start new visit |
| Unauthorized staff route | “You don't have access to this café console.” | Sign in with authorized account |

**Loading rules:** Use skeletons for lists/maps and clear “Checking…” for transactional actions. Never show a locally cached seat as claimable without revalidation. When a user returns online, re-fetch authoritative state before enabling confirmations.

---

## 19. Accessibility, responsive behavior, and discoverability

### 19.1 Accessibility principles

- Bottom navigation and all icon buttons must have visible labels or accessible names.
- Seat map has a **list view** with equivalent information; color alone never indicates availability.
- Dynamic status messages (seat conflict, timer completion, circle relocation) are announced with appropriate live-region urgency without excessive repetition.
- All primary tasks can be completed via keyboard and screen reader, including consent and confirmation overlays.
- Focus timer must not require users to track rapidly changing seconds; offer readable remaining minutes and a clear finish button.
- Present consent descriptions and expiration reasons in plain language; protect against accidental opt-ins.
- Respect reduced-motion settings and support readable contrast and text scaling.

### 19.2 Discoverability and control

- Today's next-action card adapts to intent, but static tabs remain discoverable.
- A quiet-only visitor can access Connect to learn how to opt in, without being exposed automatically.
- A social visitor doesn't need to choose a seat before exploring people/circles unless a specific action requires physical allocation.
- The AI assistant should offer deep links and direct CTAs rather than acting as the only path to a feature.

### 19.3 Responsive layouts

| Form factor | Navigation | Detail presentation | Map presentation |
|---|---|---|---|
| Small phone | Bottom tabs + More | Full page or bottom sheet | Map/list toggle |
| Large phone | Same tabs | Sheets for simple actions | Map with pinned list |
| Tablet | Nav rail | Side detail pane where useful | Map + seat details |
| Desktop customer | Sidebar/top nav | Split panel | Full map and filters |
| Desktop staff | Persistent sidebar | Tables/drawers and confirmations | Operational seat grid |

---

## 20. Component inventory and wireframe handoff

### 20.1 Shared reusable components

| Component | Used by | Required behavior |
|---|---|---|
| Café header | All customer views | Accurate venue; active visit indicator |
| Visit status card | Today, My Space, Connect, Circles | Derived from one Visit Context |
| AI assistant sheet | Today and modules | Context-aware; explicit confirm boundary |
| Consent switch block | Onboarding, Connect, Circles, Settings | Independent, default-off, explanatory |
| Recommendation card | Today, Flow, Connect, Circles | Reason + status + action + dismiss |
| Status badge | All modules | Suggested / Pending / Confirmed / Changed / Expired |
| Availability selector | Onboarding, Connect, Circles, Settings | Same time-window terminology |
| Seat tile/list row | Flow, Staff | Same authoritative occupancy; role-specific actions |
| Seat confirmation sheet | Flow | Transactional, concurrency-safe |
| Match teaser card | Connect, Today | Privacy-filtered before mutual acceptance |
| Circle card | Circles, Today | Topic, quorum, RSVP vs activation distinction |
| Operational change banner | Today, Flow, Circles | Latest authoritative update with link |
| End visit sheet | Settings, Today menu | Clear impact and explicit confirm |
| Empty/fallback panel | Everywhere | Honest reason + next best action |

### 20.2 Wireframe briefs (minimum set)

The design team should prepare high-fidelity or mid-fidelity wireframes for **E03, E04, E05, T01, G01, F01/F02/F03, F04, C01/C02/C03, R01/R02/R03/R04, S03, S05, O01/O02/O03**, plus a reusable error/empty-state kit. E01/E02/E06 and P1 destinations may start as simple low-fidelity variations.

For every wireframe, annotate: **screen ID, primary information hierarchy, main CTA, secondary actions, visit-mode variations, consent gate, server-derived status, loading/error states, and navigation destination**.

### 20.3 Screen-to-service mapping (handoff, not HLD)

| User-visible feature | UI screens | Logical service accessed |
|---|---|---|
| Start/review visit | E01–E06, T02 | Identity, Visit, Experience Orchestrator |
| View/select seat | F01–F03 | Flow Service |
| Focus timer | F04, T01 | Visit / Flow |
| Match discovery/response | C01–C05 | Connect Service |
| Circles discovery/RSVP | R01–R05 | Circles Service, Flow for group seating |
| Consent and privacy | E05, S03, C01, R01 | Visit / authorization |
| Staff occupancy | O01–O02 | Staff / Flow |
| Staff circle status | O01/O03 | Staff / Circles |
| Global assistant | G01 | Experience Orchestrator invoking approved tools |

No page should read or write another module's private database collection directly just because it is nested under that tab; backend contracts remain the authority.

---

## 21. IA-level acceptance criteria and QA scenarios

| ID | Acceptance criterion | PRD alignment |
|---|---|---|
| IA-01 | QR with valid café reaches onboarding without exposing visitor socially | FR-001, FR-006 |
| IA-02 | New visitor can review and correct AI-interpreted plan | FR-003, FR-004 |
| IA-03 | Connect and Circles remain independently off until explicitly enabled | FR-006 |
| IA-04 | Each active-visit destination is one tap from the customer shell | FR-005 |
| IA-05 | Today makes mode, confirmed seat, and next action understandable | FR-005, FR-402 |
| IA-06 | Seat suggestions and confirmed claims are visually distinct | FR-102, FR-103 |
| IA-07 | Stale seat confirmation displays refreshed alternatives | FR-103, FR-105 |
| IA-08 | Focus suppresses proactive social notifications | FR-104, FR-402 |
| IA-09 | Candidate teaser reveals no private identity/location before mutual acceptance | FR-202, FR-204 |
| IA-10 | Pending/confirmed/expired match states have distinct copy and controls | FR-204 |
| IA-11 | Circle RSVP does not masquerade as confirmed group activation | FR-302, FR-303 |
| IA-12 | Circle conflict leads to confirmed relocation or clear cancel/reschedule | FR-303, FR-403 |
| IA-13 | Switching modes updates home and eligible modules without onboarding again | FR-401, FR-402 |
| IA-14 | Removing consent immediately prevents future discovery and invalid proposals | FR-006, FR-202 |
| IA-15 | AI failure leaves direct tab navigation and core tasks usable | PRD non-functional fallback |
| IA-16 | Customer cannot access staff actions; staff sees restricted operational data | FR-501 |
| IA-17 | Screen-reader/keyboard user can complete consent, seat, RSVP, and visit exit | PRD accessibility |
| IA-18 | Expired visit and stale links do not resurrect active matches/claims | Visit Context lifecycle |

### 21.1 Test matrix for primary visit types

| Journey / mode | Today | Space | Connect | Circles | Settings |
|---|---|---|---|---|---|
| New / planning | First action | Suggestions or no seat | Off-state | Off-state | Edit plan/consents |
| Quiet-only / focusing | Timer, no social prompt | Confirmed seat, controls | Off or paused | Off or paused | Opt out/change time |
| Social-only / available | Relevant activity | Optional seat | Eligible suggestions | Eligible circles | Edit interests/time |
| Mutually accepted meeting | Meetup summary | Existing seat | Confirmed details | No conflicting RSVP | Cancel/end |
| Active circle | Circle summary | No conflicting booking | No conflicting meeting | Current circle | Leave/end |
| Expired | Closure | Unavailable | Unavailable | Unavailable | Start new visit |

---

## 22. MVP implementation order and design checkpoints

1. **Approve IA backbone:** Today as visit hub; four frequent tabs + Settings access; persistent assistant; consent boundaries.
2. **Wireframe onboarding + Today:** E01–E06, T01/T02, G01, S03; validate the one-visit mental model.
3. **Implement Flow end to end:** F01–F04 including concurrency error; staff O02 can mutate seat status.
4. **Implement Connect with mutual consent:** C01–C05, exact pre/post-acceptance visibility and focus suppression.
5. **Implement Circles:** R01–R05, RSVP vs activation, quorum/table-state and conflict update.
6. **Integrate states:** Today reflects focus/meeting/circle; notifications route to owning module; no duplicate onboarding.
7. **Test two primary variations:** social-only and quiet-only, not only the hero mixed-intent journey.
8. **Run demo rehearsal:** four simulated users, group conflict, Gemini fallback, and explicit privacy checks.

**Cut order if time is constrained:** P1 history/feed, advanced filters, post-session feedback, editable operator circles, elaborate animations. **Do not cut:** separate social consents, manual AI fallback, server-authoritative confirmation labels, protected focus mode, or the cross-module table-conflict journey.

---

## 23. Open IA decisions requiring product validation

| Decision | Proposed default | Why validation is needed |
|---|---|---|
| Four tabs + Settings menu vs five tabs | Four main tabs, Settings via header/More | Test one-handed navigation and discoverability |
| Should focus end automatically at timer zero? | Calm prompt/transition with no forced social disclosure | Avoid unexpected interruption or mode confusion |
| Can a visitor hold a seat indefinitely? | Café-configured expiry with clear in-app warning | Prevent stale claims; needs real operational policy |
| Where do confirmed 1:1 meetings occur? | Public staff-designated meeting area | Avoid exposure of exact personal seating |
| How is “I'm ready” for a meetup confirmed? | Optional acknowledgement; not a hidden presence sensor | Presence is approximate without tracking |
| Minimum info for circle participants | Topic/count before activation; agreed meetup details after | Balance privacy and trust |
| Should ending a visit automatically cancel accepted meetups? | Warn and require explicit confirmation; server cancels associated live obligations | Avoid leaving others with stale commitments |
| How many proactive suggestions? | One main next-action card; throttle others | Avoid turning BrewSpace into a noisy recommendation feed |
| Will guest sessions be sufficient in a real pilot? | Yes for seeded demo, subject to pilot review | Safety, abuse prevention, and moderation obligations |

**Decision owner:** Product lead with UX and technical leads. IA v1.0 remains a proposed design until these choices are ratified; deviations from the PRD should be recorded as change requests.

---

## 24. Deliverables and definition of IA done

The Information Architecture is ready for wireframing and frontend implementation when:

- The sitemap, tab model, and page inventory are signed off.
- Each P0 screen has a known entry, primary action, exit, empty state, and server-state dependency.
- The **same Visit Context** is demonstrably represented across Today, Space, Connect, and Circles.
- Privacy checks are specified before any social detail can render, including deep links and notifications.
- Seat claims, 1:1 acceptance, RSVP, group activation, and visit ending have explicit confirmation boundaries.
- Cross-module changes—focus completion, consent change, circle relocation—have agreed visual and navigation behavior.
- Staff and customer access remain separated.
- The wireframing team can design the MVP without inventing the core navigation or permission model.

**North-star IA outcome:** A customer can enter with one intention, change it during the visit, and use space, connection, and community features as a coherent experience—without confusion about what is suggested, what is confirmed, and what stays private.
