"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VisitShell } from "@/components/VisitShell";
import type { CircleView } from "@/lib/services/circles";
import type { Visit } from "@/lib/types";

export default function CirclesPage() {
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [circles, setCircles] = useState<CircleView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCircles = useCallback(async () => {
    const res = await fetch("/api/circles");
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
    setCircles(data.circles ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  async function toggleOptIn(enable: boolean) {
    setBusyId("optin");
    setFeedback(null);
    try {
      const res = await fetch("/api/visit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circlesOptIn: enable }),
      });
      if (res.ok) {
        setFeedback(
          enable
            ? "Coffee Circles enabled. Joining sends an RSVP; circles confirm once 3+ people accept and a group table is held."
            : "Coffee Circles paused for your visit."
        );
        await loadCircles();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRsvp(circleId: string, decision: "JOIN" | "LEAVE") {
    setBusyId(circleId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/circles/${circleId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || "Could not update your RSVP.");
      } else if (data.circle?.status === "CONFIRMED") {
        setFeedback(
          `Confirmed! "${data.circle.topic}" reached quorum and held Group Table ${data.circle.seatId}.`
        );
      } else {
        setFeedback(
          decision === "JOIN"
            ? "RSVP recorded. This circle will confirm once 3 people accept and a table is held."
            : "You left the Coffee Circle."
        );
      }
      await loadCircles();
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !visit) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-sm text-quiet-stone">
        Loading Coffee Circles...
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
            <p className="text-xs font-semibold uppercase tracking-widest text-circles-text">
              Coffee Circles · Small Groups (3–6)
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">
              20-minute shared conversations
            </h1>
          </div>
          {visit.circlesOptIn && (
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => toggleOptIn(false)}
              className="h-10 rounded-pill border border-border-subtle bg-oat-milk px-4 text-xs font-semibold text-espresso"
            >
              Pause Circles
            </button>
          )}
        </header>

        {feedback && (
          <div
            role="status"
            className="rounded-field bg-circles-bg px-4 py-3 text-sm font-medium text-circles-text"
          >
            {feedback}
          </div>
        )}

        {!visit.circlesOptIn ? (
          <section className="rounded-panel border border-border-subtle bg-porcelain p-6 shadow-ceramic">
            <h2 className="font-display text-2xl font-semibold text-espresso">
              You&apos;re not receiving group invitations
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-quiet-stone">
              Coffee Circles are short, timed 20-minute conversations at a
              designated group table. Opting in is independent from 1:1 Connect.
            </p>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => toggleOptIn(true)}
              className="mt-5 inline-flex h-12 items-center justify-center rounded-pill bg-espresso px-6 text-sm font-semibold text-warm-cream hover:bg-espresso-hover"
            >
              Enable Coffee Circles
            </button>
          </section>
        ) : (
          <section className="space-y-4">
            {circles.map((c) => {
              const isConfirmed =
                c.status === "CONFIRMED" || c.status === "ACTIVE";
              const isJoined = c.myRsvpStatus === "ACCEPTED";
              return (
                <article
                  key={c.circleId}
                  className="rounded-panel border border-border-subtle bg-porcelain p-6 shadow-subtle"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                          isConfirmed
                            ? "bg-success-bg text-success-text"
                            : c.status === "CANCELED"
                              ? "bg-error-bg text-error-text"
                              : "bg-circles-bg text-circles-text"
                        }`}
                      >
                        Circle: {c.status.replace(/_/g, " ")}
                      </span>
                      {isJoined && (
                        <span className="rounded-pill bg-espresso px-3 py-1 text-xs font-semibold text-warm-cream">
                          My RSVP: Accepted
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-quiet-stone">
                      {c.participantCount}/{c.maxParticipants} guests ·{" "}
                      {c.durationMinutes} min
                    </span>
                  </div>

                  <h2 className="mt-3 font-display text-2xl font-semibold text-espresso">
                    {c.topic}
                  </h2>
                  <p className="mt-1 text-sm text-quiet-stone">
                    {c.description}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-espresso">
                    Location: {c.visibleTableLabel}
                  </p>

                  {c.statusNote && (
                    <div
                      className={`mt-3 rounded-field px-3.5 py-2.5 text-xs font-medium ${
                        c.statusNote.startsWith("Table changed:")
                          ? "bg-warning-bg text-warning-text"
                          : "bg-oat-milk/80 text-espresso"
                      }`}
                    >
                      {c.statusNote}
                    </div>
                  )}

                  {/* R04: Optional conversation starters when joined & confirmed */}
                  {isJoined && isConfirmed && c.conversationStarters.length > 0 && (
                    <div className="mt-4 rounded-card border border-border-subtle bg-circles-bg/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-circles-text">
                        Optional conversation starters
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-espresso">
                        {c.conversationStarters.map((s) => (
                          <li key={s}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {isJoined ? (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => handleRsvp(c.circleId, "LEAVE")}
                        className="inline-flex h-11 items-center rounded-pill border border-border-subtle bg-oat-milk px-5 text-sm font-semibold text-espresso"
                      >
                        Leave circle
                      </button>
                    ) : (
                      c.status !== "CANCELED" &&
                      c.spotsLeft > 0 && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => handleRsvp(c.circleId, "JOIN")}
                          className="inline-flex h-11 items-center rounded-pill bg-espresso px-5 text-sm font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
                        >
                          {busyId === c.circleId
                            ? "Updating RSVP..."
                            : "Join circle (RSVP)"}
                        </button>
                      )
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </VisitShell>
  );
}
