"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VisitShell } from "@/components/VisitShell";
import type { SeatRecommendation } from "@/lib/services/flow";
import type { Seat, SeatZone, Visit } from "@/lib/types";

type PublicSeat = Omit<Seat, "claimedByVisitId"> & { isMine: boolean };

const ZONES: Array<{ id: SeatZone | "ALL"; label: string }> = [
  { id: "ALL", label: "All zones" },
  { id: "QUIET", label: "Quiet" },
  { id: "GENERAL", label: "General" },
  { id: "SOCIAL", label: "Social" },
  { id: "GROUP", label: "Group" },
];

export default function MySpacePage() {
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [seats, setSeats] = useState<PublicSeat[]>([]);
  const [recommendations, setRecommendations] = useState<SeatRecommendation[]>([]);
  const [zoneFilter, setZoneFilter] = useState<SeatZone | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadSeats = useCallback(
    async (zone: SeatZone | "ALL") => {
      const qs = zone === "ALL" ? "" : `?zone=${zone}`;
      const res = await fetch(`/api/flow/seats${qs}`);
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
      setSeats(data.seats ?? []);
      setRecommendations(data.recommendations ?? []);
      setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    loadSeats(zoneFilter);
  }, [zoneFilter, loadSeats]);

  async function handleConfirmSeat(seatId: string) {
    setClaimingId(seatId);
    setFeedback(null);
    try {
      const res = await fetch("/api/flow/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Could not confirm that seat.",
        });
        if (data.alternatives) {
          setRecommendations(data.alternatives);
        }
        await loadSeats(zoneFilter);
        return;
      }
      setFeedback({
        type: "success",
        text: `Seat ${seatId} is confirmed for your visit.`,
      });
      await loadSeats(zoneFilter);
    } finally {
      setClaimingId(null);
    }
  }

  if (loading || !visit) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-sm text-quiet-stone">
        Loading floor availability...
      </main>
    );
  }

  const visibleSeats =
    zoneFilter === "ALL" ? seats : seats.filter((s) => s.zone === zoneFilter);

  return (
    <VisitShell
      cafeName={visit.cafeId === "roastery-co" ? "Roastery & Co." : visit.cafeId}
      mode={visit.currentMode}
      seatId={visit.seatId}
    >
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-flow-text">
            Café Flow · My Space
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">
            {visit.seatId
              ? `Confirmed seat: ${visit.seatId}`
              : "Choose your café spot"}
          </h1>
          <p className="mt-1 text-sm text-quiet-stone">
            Suggested seats are not held until you tap{" "}
            <strong>Confirm seat</strong>.
          </p>
        </header>

        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`rounded-field px-4 py-3 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-success-bg text-success-text"
                : "bg-error-bg text-error-text"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Top Ranked Recommendations */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-espresso">
            Suggested for your visit
          </h2>
          {recommendations.length === 0 ? (
            <div className="rounded-card border border-border-subtle bg-porcelain p-5 text-sm text-quiet-stone">
              No seats match all of your current filters right now. Try another
              zone below.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.seat.seatId}
                  className="flex flex-col justify-between rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-pill bg-flow-bg px-2.5 py-0.5 text-xs font-semibold text-flow-text">
                        Suggested · {rec.seat.zone}
                      </span>
                      <span className="text-xs font-semibold text-quiet-stone">
                        Seats {rec.seat.capacity}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-espresso">
                      {rec.seat.label}
                    </h3>
                    <ul className="mt-2 space-y-1 text-xs text-quiet-stone">
                      {rec.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    disabled={claimingId !== null}
                    onClick={() => handleConfirmSeat(rec.seat.seatId)}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-pill bg-secondary px-4 text-sm font-semibold text-on-secondary transition-colors hover:opacity-95 disabled:opacity-60"
                  >
                    {claimingId === rec.seat.seatId
                      ? "Checking availability..."
                      : `Confirm ${rec.seat.seatId}`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Zone Filters + Accessible Floor Inventory */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-espresso">
              Live floor plan
            </h2>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZoneFilter(z.id)}
                  className={`h-9 rounded-pill px-3.5 text-xs font-semibold transition-colors ${
                    zoneFilter === z.id
                      ? "bg-espresso text-warm-cream"
                      : "border border-border-subtle bg-oat-milk text-espresso"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSeats.map((seat) => {
              const isAvailable = seat.status === "AVAILABLE";
              const isGroup = seat.zone === "GROUP";
              return (
                <div
                  key={seat.seatId}
                  className={`flex items-center justify-between gap-3 rounded-card border p-4 ${
                    seat.isMine
                      ? "border-flow-text bg-flow-bg/60"
                      : isAvailable
                        ? "border-border-subtle bg-porcelain"
                        : "border-border-subtle bg-oat-milk/50 opacity-80"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-espresso">
                        {seat.label}
                      </span>
                      {seat.isMine && (
                        <span className="rounded-pill bg-flow-text px-2 py-0.5 text-[11px] font-semibold text-white">
                          Confirmed
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-quiet-stone">
                      {seat.zone} · {seat.hasOutlet ? "Outlet" : "No outlet"} ·{" "}
                      {seat.isMine
                        ? "Your seat"
                        : seat.status === "AVAILABLE"
                          ? "Available"
                          : seat.status === "HELD_FOR_CIRCLE"
                            ? "Held for Circle"
                            : "Occupied"}
                    </p>
                  </div>
                  {isAvailable && !isGroup && !seat.isMine && (
                    <button
                      type="button"
                      disabled={claimingId !== null}
                      onClick={() => handleConfirmSeat(seat.seatId)}
                      className="h-10 shrink-0 rounded-pill bg-espresso px-4 text-xs font-semibold text-warm-cream hover:bg-espresso-hover disabled:opacity-60"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </VisitShell>
  );
}
