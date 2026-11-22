"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VisitShell } from "@/components/VisitShell";
import type { CircleView } from "@/lib/services/circles";
import type { SanitizedMatchView } from "@/lib/services/connect";
import type { Visit } from "@/lib/types";

export default function TodayHubPage() {
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [circles, setCircles] = useState<CircleView[]>([]);
  const [matches, setMatches] = useState<SanitizedMatchView[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      const vRes = await fetch("/api/visit");
      if (vRes.status === 401) {
        router.push("/c/roastery-co");
        return;
      }
      const vData = await vRes.json();
      if (!vData.visit) {
        router.push("/visit/setup?cafeId=roastery-co");
        return;
      }
      setVisit(vData.visit);

      const [cRes, rRes] = await Promise.all([
        fetch("/api/connect"),
        fetch("/api/circles"),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setMatches(cData.matches ?? []);
        setCandidateCount((cData.candidates ?? []).length);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setCircles(rData.circles ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  async function handleFocusAction(action: "start" | "extend" | "finish") {
    setBusyAction(true);
    setBanner(null);
    try {
      const res = await fetch("/api/flow/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          minutes: action === "extend" ? 15 : visit?.focusDurationMinutes ?? 45,
        }),
      });
      if (res.ok) {
        setBanner(
          action === "finish"
            ? "Focus session finished. Your visit is now Available."
            : action === "extend"
              ? "Extended focus by 15 minutes."
              : "Focus session started. Social notifications are paused."
        );
        await loadState();
      }
    } finally {
      setBusyAction(false);
    }
  }

  if (loading || !visit) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-sm text-quiet-stone">
        Loading your café visit...
      </main>
    );
  }

  const activeCircle = circles.find((c) => c.circleId === visit.activeCircleId);
  const confirmedMatch = matches.find((m) => m.status === "MUTUALLY_CONFIRMED");
  const focusRemainingMins = visit.focusUntil
    ? Math.max(0, Math.ceil((new Date(visit.focusUntil).getTime() - Date.now()) / 60_000))
    : null;

  return (
    <VisitShell
      cafeName={visit.cafeId === "roastery-co" ? "Roastery & Co." : visit.cafeId}
      mode={visit.currentMode}
      seatId={visit.seatId}
    >
      <div className="space-y-6">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-quiet-stone">
              Today · Active Visit
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">
              Your visit, {visit.alias}
            </h1>
          </div>
          <Link
            href="/visit/settings"
            className="text-xs font-semibold text-quiet-stone underline underline-offset-4 hover:text-espresso"
          >
            Edit preferences or end visit
          </Link>
        </header>

        {banner && (
          <div
            role="status"
            className="rounded-field bg-success-bg px-4 py-3 text-sm font-medium text-success-text"
          >
            {banner}
          </div>
        )}

        {/* Operational change alert (IA R05) — shown even during focus if a confirmed circle relocated */}
        {activeCircle?.statusNote &&
          activeCircle.statusNote.startsWith("Table changed:") && (
            <div
              role="alert"
              className="rounded-card border border-border-strong bg-warning-bg p-4 text-sm text-warning-text"
            >
              <p className="font-semibold">Coffee Circle table updated</p>
              <p className="mt-1">{activeCircle.statusNote}</p>
              <Link
                href="/visit/circles"
                className="mt-2 inline-block font-semibold underline underline-offset-4"
              >
                View updated circle
              </Link>
            </div>
          )}

        {/* 1. Now Card (Mode & Current Commitment) */}
        <section className="rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-flow-bg px-3.5 py-1 text-xs font-semibold text-flow-text">
              <span className="material-symbols-outlined text-[16px]">
                {visit.currentMode === "FOCUSING" ? "spa" : "explore"}
              </span>
              {visit.currentMode === "FOCUSING"
                ? "Focusing"
                : visit.currentMode === "IN_CIRCLE"
                  ? "In a Coffee Circle"
                  : visit.currentMode === "IN_CONNECTION"
                    ? "In a 1:1 Meetup"
                    : visit.currentMode === "AVAILABLE"
                      ? "Available"
                      : "Planning my visit"}
            </span>
            <span className="text-xs text-quiet-stone">
              {visit.seatId
                ? `Confirmed seat: ${visit.seatId}`
                : "No seat confirmed yet"}
            </span>
          </div>

          {visit.currentMode === "FOCUSING" ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold text-espresso">
                  {focusRemainingMins !== null
                    ? `${focusRemainingMins} min remaining`
                    : "Focus session active"}
                </p>
                <p className="mt-1 text-sm text-quiet-stone">
                  Social invitations are paused while you focus. When you&apos;re
                  ready, finish focus to refresh eligible suggestions.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() => handleFocusAction("finish")}
                  className="inline-flex h-12 items-center gap-2 rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Finish focus
                </button>
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={() => handleFocusAction("extend")}
                  className="inline-flex h-12 items-center gap-2 rounded-pill border border-border-subtle bg-oat-milk px-5 text-sm font-semibold text-espresso hover:bg-surface-container-highest disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    more_time
                  </span>
                  Extend 15m
                </button>
              </div>
            </div>
          ) : confirmedMatch ? (
            <div className="mt-4 space-y-3">
              <p className="font-display text-2xl font-semibold text-espresso">
                Confirmed 1:1 meetup with {confirmedMatch.partnerAlias}
              </p>
              <p className="text-sm text-quiet-stone">
                {confirmedMatch.meetupInstructions}
              </p>
              <Link
                href="/visit/connect"
                className="inline-flex h-11 items-center rounded-pill bg-tertiary px-5 text-sm font-semibold text-on-tertiary"
              >
                View meetup details
              </Link>
            </div>
          ) : activeCircle ? (
            <div className="mt-4 space-y-3">
              <p className="font-display text-2xl font-semibold text-espresso">
                {activeCircle.topic}
              </p>
              <p className="text-sm text-quiet-stone">
                Status: <strong>{activeCircle.status}</strong> ·{" "}
                {activeCircle.visibleTableLabel}
              </p>
              <Link
                href="/visit/circles"
                className="inline-flex h-11 items-center rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream"
              >
                Open my circle
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="font-display text-2xl font-semibold text-espresso">
                {visit.seatId
                  ? `Settled at Seat ${visit.seatId}`
                  : "Ready to pick your spot?"}
              </p>
              <p className="text-sm text-quiet-stone">
                {visit.seatId
                  ? "Start a quiet focus session or explore social options you've opted into."
                  : "Browse live floor availability in My Space and confirm a seat with one tap."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/visit/space"
                  className="inline-flex h-12 items-center gap-2 rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream hover:bg-espresso-hover"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    event_seat
                  </span>
                  {visit.seatId ? "Manage seat & focus" : "Find my seat"}
                </Link>
                {visit.seatId && (
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleFocusAction("start")}
                    className="inline-flex h-12 items-center gap-2 rounded-pill border border-border-subtle bg-oat-milk px-5 text-sm font-semibold text-espresso"
                  >
                    Start focus timer
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 2. Next Best Action — STRICTLY suppressed for social discovery during FOCUSING (PRD FR-104) */}
        {visit.currentMode !== "FOCUSING" &&
          visit.currentMode !== "IN_CONNECTION" &&
          visit.currentMode !== "IN_CIRCLE" && (
            <section className="rounded-panel border border-border-subtle bg-oat-milk/80 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-connect-text">
                Suggested next step
              </p>
              {visit.connectOptIn && candidateCount > 0 ? (
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-espresso">
                      {candidateCount}{" "}
                      {candidateCount === 1
                        ? "eligible 1:1 connection"
                        : "eligible 1:1 connections"}{" "}
                      available
                    </h2>
                    <p className="mt-1 text-sm text-quiet-stone">
                      Review anonymized interest teasers in Connect—nothing is
                      shared unless both people accept.
                    </p>
                  </div>
                  <Link
                    href="/visit/connect"
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-pill bg-tertiary px-5 text-sm font-semibold text-on-tertiary"
                  >
                    Review in Connect
                  </Link>
                </div>
              ) : visit.circlesOptIn && circles.length > 0 ? (
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-espresso">
                      {circles[0].topic}
                    </h2>
                    <p className="mt-1 text-sm text-quiet-stone">
                      {circles[0].participantCount}/{circles[0].maxParticipants}{" "}
                      RSVPs · 20-minute Coffee Circle.
                    </p>
                  </div>
                  <Link
                    href="/visit/circles"
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream"
                  >
                    Explore Circles
                  </Link>
                </div>
              ) : (
                <div className="mt-2">
                  <h2 className="font-display text-xl font-semibold text-espresso">
                    Enjoy your quiet visit
                  </h2>
                  <p className="mt-1 text-sm text-quiet-stone">
                    Social discovery is currently off. You can enable 1:1
                    Connect or Coffee Circles anytime from their tabs or
                    Settings.
                  </p>
                </div>
              )}
            </section>
          )}

        {/* 3. Quick Module Entry Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/visit/space"
            className="rounded-card border border-border-subtle bg-flow-bg/70 p-5 transition-colors hover:bg-flow-bg"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-flow-text">
              Café Flow · My Space
            </p>
            <p className="mt-2 font-semibold text-espresso">
              {visit.seatId ? `Confirmed: ${visit.seatId}` : "Choose a seat"}
            </p>
            <p className="mt-1 text-xs text-quiet-stone">
              Live floor availability, zone filters, and focus timer.
            </p>
          </Link>

          <Link
            href="/visit/connect"
            className="rounded-card border border-border-subtle bg-connect-bg/60 p-5 transition-colors hover:bg-connect-bg"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-connect-text">
              Café Connect · 1:1
            </p>
            <p className="mt-2 font-semibold text-espresso">
              {!visit.connectOptIn
                ? "Discovery off"
                : visit.currentMode === "FOCUSING"
                  ? "Paused during focus"
                  : `${candidateCount} eligible now`}
            </p>
            <p className="mt-1 text-xs text-quiet-stone">
              Consent-first introductions with mutual acceptance.
            </p>
          </Link>

          <Link
            href="/visit/circles"
            className="rounded-card border border-border-subtle bg-circles-bg/70 p-5 transition-colors hover:bg-circles-bg"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-circles-text">
              Coffee Circles · Groups
            </p>
            <p className="mt-2 font-semibold text-espresso">
              {!visit.circlesOptIn
                ? "Discovery off"
                : `${circles.length} open circles`}
            </p>
            <p className="mt-1 text-xs text-quiet-stone">
              20-minute tables of 3–6 around shared interests.
            </p>
          </Link>
        </section>
      </div>
    </VisitShell>
  );
}
