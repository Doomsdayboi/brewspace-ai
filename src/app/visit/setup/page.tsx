"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  IntentType,
  MeetingGoal,
  ParsedIntent,
  SeatZone,
  Visit,
} from "@/lib/types";

type Step = "intent" | "review" | "consent" | "plan";

const EXAMPLE_PROMPTS = [
  "I want a quiet table with an outlet for 60 minutes, then meet people interested in AI startups.",
  "I have 25 minutes and want to meet someone interested in books.",
  "Just a quiet window seat for 90 minutes of deep work, no social prompts.",
];

const ALL_INTENTS: Array<{ id: IntentType; label: string }> = [
  { id: "FOCUS", label: "Quiet focus" },
  { id: "CONNECT", label: "1:1 conversation" },
  { id: "CIRCLES", label: "Coffee Circle (group)" },
  { id: "RELAX", label: "Relax & read" },
];

const ZONES: Array<{ id: SeatZone; label: string }> = [
  { id: "QUIET", label: "Quiet zone" },
  { id: "GENERAL", label: "General seating" },
  { id: "SOCIAL", label: "Social area" },
  { id: "GROUP", label: "Group table" },
];

function VisitSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cafeId = searchParams.get("cafeId") || "roastery-co";

  const [step, setStep] = useState<Step>("intent");
  const [message, setMessage] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"gemini" | "fallback" | "manual">(
    "manual"
  );
  const [summary, setSummary] = useState("");
  const [clarification, setClarification] = useState<string | null>(null);

  // Editable Visit Context fields (E04)
  const [intents, setIntents] = useState<IntentType[]>(["FOCUS"]);
  const [focusDuration, setFocusDuration] = useState<string>("60");
  const [preferredZone, setPreferredZone] = useState<SeatZone>("QUIET");
  const [needsOutlet, setNeedsOutlet] = useState(true);
  const [quietPreferred, setQuietPreferred] = useState(true);
  const [interestsInput, setInterestsInput] = useState("");
  const [meetingGoal, setMeetingGoal] = useState<MeetingGoal>("exchange_ideas");

  // Separate explicit consents — ALWAYS OFF BY DEFAULT (PRD FR-006)
  const [connectOptIn, setConnectOptIn] = useState(false);
  const [circlesOptIn, setCirclesOptIn] = useState(false);

  // Server-saved Visit (E06)
  const [createdVisit, setCreatedVisit] = useState<Visit | null>(null);

  function applyParsedIntent(parsed: ParsedIntent) {
    setIntents(parsed.intents.length ? parsed.intents : ["RELAX"]);
    setFocusDuration(
      parsed.focusDurationMinutes ? String(parsed.focusDurationMinutes) : ""
    );
    setPreferredZone(parsed.spacePreferences.preferredZone ?? "GENERAL");
    setNeedsOutlet(parsed.spacePreferences.needsOutlet);
    setQuietPreferred(parsed.spacePreferences.quietPreferred);
    setInterestsInput(parsed.interests.join(", "));
    if (parsed.meetingGoal) setMeetingGoal(parsed.meetingGoal);
    setSummary(parsed.summary);
    setClarification(parsed.clarificationNeeded);
    setAiSource(parsed.source);
  }

  async function handleParseIntent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 2) {
      setError("Tell us briefly what you'd like to do, or choose manual setup.");
      return;
    }

    setParsing(true);
    try {
      const res = await fetch("/api/intent/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId, message: message.trim() }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/c/${cafeId}/welcome`);
        return;
      }
      if (!res.ok || !data.intent) {
        setError(
          data.error ||
            "I couldn't build a plan right now, but you can set your preferences manually."
        );
        return;
      }
      applyParsedIntent(data.intent);
      setStep("review");
    } catch {
      setError(
        "I couldn't reach the assistant right now. You can continue with manual setup."
      );
    } finally {
      setParsing(false);
    }
  }

  function toggleIntent(id: IntentType) {
    setIntents((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
      }
      return [...prev, id];
    });
  }

  async function handleCreateVisit(skipSocial = false) {
    setError(null);
    setSaving(true);
    const parsedDuration = focusDuration ? parseInt(focusDuration, 10) : null;
    const validDuration =
      parsedDuration && parsedDuration >= 10 && parsedDuration <= 240
        ? parsedDuration
        : null;

    const cleanInterests = interestsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

    try {
      const res = await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeId,
          intents,
          interests: cleanInterests,
          meetingGoal,
          spacePreferences: {
            preferredZone,
            needsOutlet,
            minCapacity: 1,
            quietPreferred,
          },
          focusDurationMinutes: validDuration,
          connectOptIn: skipSocial ? false : connectOptIn,
          circlesOptIn: skipSocial ? false : circlesOptIn,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/c/${cafeId}/welcome`);
        return;
      }
      if (!res.ok || !data.visit) {
        setError(data.error || "Could not save your visit plan.");
        return;
      }
      setCreatedVisit(data.visit);
      setStep("plan");
    } catch {
      setError("Network error while saving your visit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const stepIndex =
    step === "intent" ? 2 : step === "review" ? 3 : step === "consent" ? 4 : 4;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (step === "intent") router.push(`/c/${cafeId}/welcome`);
            else if (step === "review") setStep("intent");
            else if (step === "consent") setStep("review");
            else setStep("consent");
          }}
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-medium text-quiet-stone transition-colors hover:bg-oat-milk hover:text-espresso"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back
        </button>
        <span className="text-xs font-medium text-quiet-stone">
          {step === "plan" ? "Plan ready" : `Step ${stepIndex} of 4`}
        </span>
      </header>

      {/* E03: Tell Us Your Plan */}
      {step === "intent" && (
        <section className="mt-6 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">
            What would you like from your café visit?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
            Describe your ideal pace in your own words. You&apos;ll be able to
            review and adjust every detail before anything is saved.
          </p>

          <form onSubmit={handleParseIntent} className="mt-5 space-y-4">
            <label htmlFor="intent-input" className="sr-only">
              Describe your café visit
            </label>
            <textarea
              id="intent-input"
              rows={4}
              maxLength={500}
              placeholder="e.g., I need a quiet table with an outlet for an hour, and afterward I'd like to discuss AI with other developers."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-field border border-border-subtle bg-fresh-milk p-4 text-base leading-relaxed text-espresso placeholder:text-quiet-stone/60 focus:border-focus-ring focus:outline-none"
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-quiet-stone">
                Quick examples
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setMessage(example)}
                    className="rounded-field border border-border-subtle bg-oat-milk/60 px-3.5 py-2.5 text-left text-xs leading-relaxed text-espresso transition-colors hover:bg-oat-milk"
                  >
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-field bg-error-bg px-4 py-3 text-sm text-error-text"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={parsing}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                <span>{parsing ? "Building your plan..." : "Build my plan"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiSource("manual");
                  setSummary("Configure your visit preferences directly.");
                  setStep("review");
                }}
                className="inline-flex h-12 w-full items-center justify-center rounded-pill border border-border-subtle bg-oat-milk px-6 text-sm font-semibold text-espresso transition-colors hover:bg-surface-container-highest"
              >
                Set up manually without AI
              </button>
            </div>
          </form>
        </section>
      )}

      {/* E04: Review & Edit Interpretation */}
      {step === "review" && (
        <section className="mt-6 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic sm:p-8">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-display text-2xl font-semibold text-espresso">
              Review your visit plan
            </h1>
            <span className="rounded-pill bg-oat-milk px-3 py-1 text-xs font-medium text-quiet-stone">
              {aiSource === "gemini"
                ? "Suggested by Gemini"
                : aiSource === "fallback"
                  ? "Quick parse"
                  : "Manual"}
            </span>
          </div>

          {summary && (
            <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
              {summary}
            </p>
          )}

          {clarification && (
            <div className="mt-4 rounded-field bg-warning-bg px-4 py-3 text-sm text-warning-text">
              {clarification}
            </div>
          )}

          <div className="mt-6 space-y-5">
            {/* Intents */}
            <div>
              <p className="text-sm font-semibold text-espresso">
                What brings you here?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_INTENTS.map((item) => {
                  const active = intents.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleIntent(item.id)}
                      className={`h-10 rounded-pill px-4 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-espresso text-warm-cream"
                          : "border border-border-subtle bg-oat-milk text-espresso hover:bg-surface-container-highest"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Focus duration */}
            <div>
              <label
                htmlFor="focus-duration"
                className="block text-sm font-semibold text-espresso"
              >
                Focus duration (minutes, optional)
              </label>
              <input
                id="focus-duration"
                type="number"
                min={10}
                max={240}
                placeholder="Not set"
                value={focusDuration}
                onChange={(e) => setFocusDuration(e.target.value)}
                className="mt-2 h-12 w-full rounded-field border border-border-subtle bg-fresh-milk px-4 text-base text-espresso focus:border-focus-ring focus:outline-none"
              />
            </div>

            {/* Seating needs */}
            <div>
              <p className="text-sm font-semibold text-espresso">
                Preferred seating zone
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ZONES.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      setPreferredZone(z.id);
                      setQuietPreferred(z.id === "QUIET");
                    }}
                    className={`h-11 rounded-field px-3 text-xs font-semibold transition-colors ${
                      preferredZone === z.id
                        ? "bg-flow-bg text-flow-text ring-1 ring-flow-text"
                        : "border border-border-subtle bg-fresh-milk text-espresso hover:bg-oat-milk"
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-espresso">
                <input
                  type="checkbox"
                  checked={needsOutlet}
                  onChange={(e) => setNeedsOutlet(e.target.checked)}
                  className="h-5 w-5 rounded accent-espresso"
                />
                <span>I need a power outlet</span>
              </label>
            </div>

            {/* Interests */}
            <div>
              <label
                htmlFor="interests"
                className="block text-sm font-semibold text-espresso"
              >
                Topics or interests (comma-separated, optional)
              </label>
              <input
                id="interests"
                type="text"
                placeholder="e.g., AI, startups, books"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                className="mt-2 h-12 w-full rounded-field border border-border-subtle bg-fresh-milk px-4 text-base text-espresso focus:border-focus-ring focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("consent")}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover"
              >
                <span>Looks right — choose privacy</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStep("intent")}
                className="inline-flex h-12 w-full items-center justify-center rounded-pill border border-border-subtle bg-oat-milk px-6 text-sm font-semibold text-espresso"
              >
                Try different wording
              </button>
            </div>
          </div>
        </section>
      )}

      {/* E05: Independent Social Permissions (Off by Default) */}
      {step === "consent" && (
        <section className="mt-6 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-espresso">
            Choose your social permissions
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
            Both options start <strong>off by default</strong>. You can turn
            either one on or off at any time in Settings.
          </p>

          <div className="mt-6 space-y-4">
            {/* Connect Toggle */}
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-card border border-border-subtle bg-connect-bg/40 p-4">
              <div>
                <p className="text-sm font-semibold text-connect-text">
                  Allow 1:1 connection suggestions (Café Connect)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-quiet-stone">
                  Uses your topics and available time window to suggest relevant
                  people at this café. Your alias and meetup area are only
                  shared after <strong>both</strong> people accept.
                </p>
              </div>
              <input
                type="checkbox"
                checked={connectOptIn}
                onChange={(e) => setConnectOptIn(e.target.checked)}
                aria-label="Allow 1:1 connection suggestions"
                className="mt-1 h-5 w-5 shrink-0 accent-tertiary"
              />
            </label>

            {/* Circles Toggle */}
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-card border border-border-subtle bg-circles-bg/50 p-4">
              <div>
                <p className="text-sm font-semibold text-circles-text">
                  Allow group circle suggestions (Coffee Circles)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-quiet-stone">
                  Lets you see and RSVP to 20-minute small-group discussions
                  (3–6 people). Joining an RSVP does not confirm a group until
                  at least 3 people accept and a group table is held.
                </p>
              </div>
              <input
                type="checkbox"
                checked={circlesOptIn}
                onChange={(e) => setCirclesOptIn(e.target.checked)}
                aria-label="Allow group circle suggestions"
                className="mt-1 h-5 w-5 shrink-0 accent-espresso"
              />
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-field bg-error-bg px-4 py-3 text-sm text-error-text"
            >
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleCreateVisit(false)}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover disabled:opacity-60"
            >
              <span>
                {saving ? "Saving visit..." : "Continue with these choices"}
              </span>
              <span className="material-symbols-outlined text-[18px]">
                check
              </span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleCreateVisit(true)}
              className="inline-flex h-12 w-full items-center justify-center rounded-pill border border-border-subtle bg-oat-milk px-6 text-sm font-semibold text-espresso"
            >
              Skip social features (quiet visit only)
            </button>
          </div>
        </section>
      )}

      {/* E06: Suggested Visit Plan */}
      {step === "plan" && createdVisit && (
        <section className="mt-6 rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-success-bg px-3 py-1 text-xs font-semibold text-success-text">
            <span className="material-symbols-outlined text-[16px]">
              check_circle
            </span>
            Visit created
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-espresso">
            Your visit plan is ready, {createdVisit.alias}
          </h1>
          <p className="mt-2 text-sm text-quiet-stone">
            Nothing has been booked or shared yet. Choose your first step below
            or head to Today.
          </p>

          <div className="mt-5 space-y-3 rounded-card border border-border-subtle bg-oat-milk/60 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-quiet-stone">Preferred zone</span>
              <span className="font-semibold text-espresso">
                {createdVisit.spacePreferences.preferredZone ?? "General"}
                {createdVisit.spacePreferences.needsOutlet ? " · Outlet" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-quiet-stone">Focus session</span>
              <span className="font-semibold text-espresso">
                {createdVisit.focusDurationMinutes
                  ? `${createdVisit.focusDurationMinutes} min`
                  : "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-quiet-stone">1:1 Connect</span>
              <span className="font-semibold text-espresso">
                {createdVisit.connectOptIn ? "Opted in" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-quiet-stone">Coffee Circles</span>
              <span className="font-semibold text-espresso">
                {createdVisit.circlesOptIn ? "Opted in" : "Off"}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push("/visit/today")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream transition-colors hover:bg-espresso-hover"
            >
              <span>Go to Today</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default function VisitSetupPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6 text-sm text-quiet-stone">
          Loading your café setup...
        </main>
      }
    >
      <VisitSetupInner />
    </Suspense>
  );
}
