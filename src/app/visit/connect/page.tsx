"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VisitShell } from "@/components/VisitShell";
import type {
  AnonymizedCandidateTeaser,
  SanitizedMatchView,
} from "@/lib/services/connect";
import type { Visit } from "@/lib/types";

export default function ConnectPage() {
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [suppressedReason, setSuppressedReason] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<AnonymizedCandidateTeaser[]>([]);
  const [matches, setMatches] = useState<SanitizedMatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadConnect = useCallback(async () => {
    const res = await fetch("/api/connect");
    if (res.status === 401) {
      router.push("/c/roastery-co");
      return;
    }
    if (res.status === 404) {
      router.push("/visit/setup?cafeId=roastery-co");
      return;
    }
    const data = await res.json();
    setVisit(data.visit);
    setSuppressedReason(data.suppressedReason);
    setCandidates(data.candidates ?? []);
    setMatches(data.matches ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadConnect();
  }, [loadConnect]);

  async function toggleOptIn(enable: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/visit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectOptIn: enable }),
      });
      if (res.ok) {
        setMessage(
          enable
            ? "Café Connect is now on. You control every introduction."
            : "Café Connect is off. You are removed from new 1:1 discovery."
        );
        await loadConnect();
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendInvite(candidateRef: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateRef }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not send invitation.");
      } else {
        setMessage(
          "Invitation sent (Pending). Names and meetup instructions are only revealed if both people accept."
        );
      }
      await loadConnect();
    } finally {
      setBusy(false);
    }
  }

  async function respondMatch(
    matchId: string,
    decision: "ACCEPT" | "DECLINE" | "CANCEL" | "COMPLETE"
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/connect/${matchId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data.error || "Could not update invitation.");
      await loadConnect();
    } finally {
      setBusy(false);
    }
  }

  if (loading || !visit) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-sm text-quiet-stone">
        Loading Café Connect...
      </main>
    );
  }

  return (
    <VisitShell
      cafeName={visit.cafeId === "roastery-co" ? "Roastery & Co." : visit.cafeId}
      mode={visit.currentMode}
      seatId={visit.seatId}
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-connect-text">
              Café Connect · 1:1 Introductions
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">
              Meet people on your terms
            </h1>
          </div>
          {visit.connectOptIn && (
            <button
              type="button"
              disabled={busy}
              onClick={() => toggleOptIn(false)}
              className="h-10 rounded-pill border border-border-subtle bg-oat-milk px-4 text-xs font-semibold text-espresso"
            >
              Pause Connect
            </button>
          )}
        </header>

        {message && (
          <div
            role="status"
            className="rounded-field bg-oat-milk px-4 py-3 text-sm font-medium text-espresso"
          >
            {message}
          </div>
        )}

        {/* C01: Explicit Opt-In Gate when OFF */}
        {!visit.connectOptIn ? (
          <section className="rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic">
            <h2 className="font-display text-2xl font-semibold text-espresso">
              You&apos;re not visible for 1:1 discovery
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
              When you turn on Café Connect, other opted-in guests at this café
              can see an anonymized teaser of your shared topics—never your
              alias or exact seat—until <strong>both</strong> of you accept.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => toggleOptIn(true)}
              className="mt-5 inline-flex h-12 items-center justify-center rounded-pill bg-tertiary px-6 text-sm font-semibold text-on-tertiary hover:opacity-95 disabled:opacity-60"
            >
              Enable Café Connect
            </button>
          </section>
        ) : suppressedReason === "FOCUSING" ? (
          <section className="rounded-panel border border-border-subtle bg-flow-bg/60 p-6">
            <h2 className="font-display text-xl font-semibold text-flow-text">
              Suggestions are held while you focus
            </h2>
            <p className="mt-1 text-sm text-quiet-stone">
              When you finish your focus session, eligible 1:1 suggestions will
              appear here automatically.
            </p>
            <Link
              href="/visit/today"
              className="mt-4 inline-flex h-11 items-center rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream"
            >
              Manage focus on Today
            </Link>
          </section>
        ) : (
          <>
            {/* Active & Pending Matches (C03–C05) */}
            {matches.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-xl font-semibold text-espresso">
                  Your invitations &amp; meetups
                </h2>
                <div className="space-y-3">
                  {matches.map((m) => (
                    <div
                      key={m.matchId}
                      className="rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                            m.status === "MUTUALLY_CONFIRMED"
                              ? "bg-success-bg text-success-text"
                              : "bg-connect-bg text-connect-text"
                          }`}
                        >
                          {m.status === "MUTUALLY_CONFIRMED"
                            ? "Confirmed — Both accepted"
                            : m.status === "PENDING_OTHER"
                              ? "Pending — Waiting for other guest"
                              : m.status}
                        </span>
                        <span className="text-xs text-quiet-stone">
                          Topics: {m.sharedInterests.join(", ")}
                        </span>
                      </div>

                      {m.status === "MUTUALLY_CONFIRMED" ? (
                        <div className="mt-3 space-y-2 text-sm">
                          <p className="font-semibold text-espresso">
                            Connected with {m.partnerAlias}
                          </p>
                          <p className="text-quiet-stone">
                            {m.meetupInstructions}
                          </p>
                          {m.conversationStarter && (
                            <p className="rounded-field bg-oat-milk/70 p-3 text-xs text-espresso">
                              <strong>Optional icebreaker:</strong>{" "}
                              {m.conversationStarter}
                            </p>
                          )}
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => respondMatch(m.matchId, "COMPLETE")}
                              className="h-10 rounded-pill bg-espresso px-4 text-xs font-semibold text-warm-cream"
                            >
                              Finish meetup
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => respondMatch(m.matchId, "CANCEL")}
                              className="h-10 rounded-pill border border-border-subtle bg-oat-milk px-4 text-xs font-semibold text-espresso"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2 text-sm">
                          <p className="text-quiet-stone">{m.reason}</p>
                          <p className="text-xs text-quiet-stone">
                            Alias and meetup details stay private until both
                            people accept.
                          </p>
                          {m.status === "PENDING_OTHER" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => respondMatch(m.matchId, "CANCEL")}
                              className="mt-2 h-10 rounded-pill border border-border-subtle bg-oat-milk px-4 text-xs font-semibold text-espresso"
                            >
                              Cancel request
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* C02: Anonymized Suggested Connections */}
            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-espresso">
                Suggested connections (anonymized)
              </h2>
              {candidates.length === 0 ? (
                <div className="rounded-card border border-border-subtle bg-porcelain p-5 text-sm text-quiet-stone">
                  No eligible connections right now. Try updating your interests
                  in Settings or check back shortly.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {candidates.map((cand) => (
                    <div
                      key={cand.candidateRef}
                      className="flex flex-col justify-between rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-pill bg-connect-bg px-3 py-1 text-xs font-semibold text-connect-text">
                            Suggested · Anonymized guest
                          </span>
                          <span className="text-xs text-quiet-stone">
                            {cand.windowLabel}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-espresso">
                          Shared topics: {cand.sharedInterests.join(", ")}
                        </p>
                        <p className="mt-1 text-xs text-quiet-stone">
                          Goal: {cand.goalLabel}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-quiet-stone">
                          {cand.reason}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendInvite(cand.candidateRef)}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-pill bg-tertiary px-4 text-sm font-semibold text-on-tertiary hover:opacity-95 disabled:opacity-60"
                      >
                        Interested — Send invitation
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </VisitShell>
  );
}
