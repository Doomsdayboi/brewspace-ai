"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { BrewSpaceEvent, Cafe, SeatStatus, SeatZone } from "@/lib/types";

interface OperationalSeat {
  seatId: string;
  label: string;
  zone: SeatZone;
  capacity: number;
  hasOutlet: boolean;
  status: SeatStatus;
  heldByCircleId: string | null;
}

interface OperationalCircle {
  circleId: string;
  topic: string;
  status: string;
  seatId: string | null;
  participantCount: number;
  minParticipants: number;
  maxParticipants: number;
  statusNote: string | null;
}

interface StaffOverview {
  cafe: Cafe;
  role: "staff" | "demo_admin";
  kpis: {
    totalSeats: number;
    occupiedSeats: number;
    availableSeats: number;
    activeVisits: number;
    activeFocusers: number;
    confirmedCircles: number;
  };
  seats: OperationalSeat[];
  circles: OperationalCircle[];
  events: BrewSpaceEvent[];
}

export default function StaffConsolePage() {
  const params = useParams<{ cafeId: string }>();
  const router = useRouter();
  const cafeId = params.cafeId || "roastery-co";

  const [data, setData] = useState<StaffOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busySeat, setBusySeat] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const res = await fetch(
      `/api/staff/overview?cafeId=${encodeURIComponent(cafeId)}`
    );
    if (res.status === 403 || res.status === 401) {
      router.push("/staff/login");
      return;
    }
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [cafeId, router]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  async function updateSeatStatus(
    seatId: string,
    status: "AVAILABLE" | "OCCUPIED" | "UNAVAILABLE"
  ) {
    setBusySeat(seatId);
    setNotice(null);
    try {
      const res = await fetch("/api/staff/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatId, status }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.conflictResolution?.relocated) {
          setNotice(
            `Updated ${seatId} to ${status}. Active Coffee Circle automatically relocated to Group Table ${json.conflictResolution.newSeatId}.`
          );
        } else if (json.conflictResolution?.canceled) {
          setNotice(
            `Updated ${seatId} to ${status}. No alternate group table was free, so the circle was cleanly canceled.`
          );
        } else {
          setNotice(`Seat ${seatId} marked ${status}.`);
        }
        await loadOverview();
      }
    } finally {
      setBusySeat(null);
    }
  }

  if (loading || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-6 text-sm text-quiet-stone">
        Loading Staff Operations Console...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream pb-12">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-porcelain/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-warm-cream">
              <span className="material-symbols-outlined text-[18px]">
                storefront
              </span>
            </span>
            <div>
              <p className="font-display text-base font-semibold leading-none text-espresso">
                Staff Operations Console
              </p>
              <p className="mt-0.5 text-xs text-quiet-stone">
                {data.cafe.name} · Role: {data.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.role === "demo_admin" && (
              <Link
                href={`/demo/${cafeId}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-pill bg-connect-bg px-4 text-xs font-semibold text-connect-text"
              >
                <span className="material-symbols-outlined text-[16px]">
                  science
                </span>
                Demo Simulator
              </Link>
            )}
            <button
              type="button"
              onClick={loadOverview}
              className="inline-flex h-10 items-center rounded-pill border border-border-subtle bg-oat-milk px-4 text-xs font-semibold text-espresso"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {notice && (
          <div
            role="status"
            className="rounded-field bg-warning-bg px-4 py-3 text-sm font-medium text-warning-text"
          >
            {notice}
          </div>
        )}

        {/* O01: KPI Strip */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-wider text-quiet-stone">
              Occupied Seats
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-espresso">
              {data.kpis.occupiedSeats}/{data.kpis.totalSeats}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-wider text-quiet-stone">
              Active Focusers
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-flow-text">
              {data.kpis.activeFocusers}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-wider text-quiet-stone">
              Confirmed Circles
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-circles-text">
              {data.kpis.confirmedCircles}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-porcelain p-5 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-wider text-quiet-stone">
              Active Visits
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-espresso">
              {data.kpis.activeVisits}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* O02: Live Floor Occupancy Grid */}
          <section className="space-y-4 lg:col-span-7">
            <h2 className="font-display text-xl font-semibold text-espresso">
              Live Floor Occupancy (O02)
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.seats.map((seat) => (
                <div
                  key={seat.seatId}
                  className="flex flex-col justify-between rounded-card border border-border-subtle bg-porcelain p-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-espresso">
                        {seat.label}
                      </span>
                      <span
                        className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${
                          seat.status === "AVAILABLE"
                            ? "bg-flow-bg text-flow-text"
                            : seat.status === "HELD_FOR_CIRCLE"
                              ? "bg-circles-bg text-circles-text"
                              : "bg-oat-milk text-espresso"
                        }`}
                      >
                        {seat.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-quiet-stone">
                      {seat.zone} · Seats {seat.capacity}
                      {seat.heldByCircleId
                        ? ` · Held by ${seat.heldByCircleId}`
                        : ""}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {seat.status !== "AVAILABLE" && (
                      <button
                        type="button"
                        disabled={busySeat === seat.seatId}
                        onClick={() => updateSeatStatus(seat.seatId, "AVAILABLE")}
                        className="h-9 rounded-pill bg-flow-bg px-3 text-xs font-semibold text-flow-text"
                      >
                        Mark Available
                      </button>
                    )}
                    {seat.status !== "OCCUPIED" && (
                      <button
                        type="button"
                        disabled={busySeat === seat.seatId}
                        onClick={() => updateSeatStatus(seat.seatId, "OCCUPIED")}
                        className="h-9 rounded-pill bg-espresso px-3 text-xs font-semibold text-warm-cream"
                      >
                        Mark Occupied
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* O03: Circles Monitor & Event Log */}
          <section className="space-y-6 lg:col-span-5">
            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-espresso">
                Coffee Circles Monitor (O03)
              </h2>
              {data.circles.map((c) => (
                <div
                  key={c.circleId}
                  className="rounded-card border border-border-subtle bg-porcelain p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-espresso">
                      {c.topic}
                    </span>
                    <span className="rounded-pill bg-circles-bg px-2.5 py-0.5 text-xs font-semibold text-circles-text">
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-quiet-stone">
                    Participants: {c.participantCount}/{c.maxParticipants} (min{" "}
                    {c.minParticipants}) · Table:{" "}
                    <strong>{c.seatId ?? "Unassigned"}</strong>
                  </p>
                  {c.statusNote && (
                    <p className="mt-2 rounded-field bg-oat-milk/70 p-2.5 text-xs text-espresso">
                      {c.statusNote}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold text-espresso">
                Recent Operational Events
              </h2>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-card border border-border-subtle bg-porcelain p-4 text-xs">
                {data.events.map((evt) => (
                  <div
                    key={evt.eventId}
                    className="border-b border-border-subtle/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-semibold text-espresso">
                      {evt.type}
                    </span>
                    <p className="mt-0.5 text-quiet-stone">{evt.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
