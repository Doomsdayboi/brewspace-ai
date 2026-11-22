import crypto from "crypto";
import {
  getFirestoreDb,
  getMemoryState,
  getSeat,
  getVisitById,
  isFirestoreEnabled,
  listSeats,
  recordEvent,
  saveSeat,
  saveVisit,
} from "../store";
import type { Seat, SeatZone, SpacePreferences, Visit } from "../types";

export interface SeatRecommendation {
  seat: Seat;
  score: number;
  reasons: string[];
}

/**
 * Deterministic rule-based seat ranking (PRD FR-102 & §9.1).
 * Hard constraints first (AVAILABLE, capacity, exclude GROUP tables for solo focus).
 */
export function rankAvailableSeats(
  seats: Seat[],
  prefs: SpacePreferences,
  filterZone?: SeatZone
): SeatRecommendation[] {
  const survivors = seats.filter((s) => {
    if (s.status !== "AVAILABLE") return false;
    if (s.capacity < prefs.minCapacity) return false;
    if (filterZone && s.zone !== filterZone) return false;
    // Group tables are reserved for Coffee Circles unless explicitly filtered
    if (!filterZone && prefs.preferredZone !== "GROUP" && s.zone === "GROUP") {
      return false;
    }
    return true;
  });

  const ranked = survivors.map((seat) => {
    let score = 0;
    const reasons: string[] = [];

    if (prefs.preferredZone && seat.zone === prefs.preferredZone) {
      score += 45;
      reasons.push(`Matches your ${seat.zone.toLowerCase()} zone preference`);
    } else if (prefs.quietPreferred && seat.zone === "QUIET") {
      score += 40;
      reasons.push("Quiet zone for focused work");
    } else if (seat.zone === "GENERAL") {
      score += 15;
    }

    if (prefs.needsOutlet) {
      if (seat.hasOutlet) {
        score += 35;
        reasons.push("Has a dedicated power outlet");
      } else {
        score -= 20;
      }
    } else if (seat.hasOutlet) {
      score += 5;
      reasons.push("Power outlet available");
    }

    if (seat.capacity === prefs.minCapacity) {
      score += 10;
    }

    if (reasons.length === 0) {
      reasons.push(`${seat.zone.toLowerCase()} seating · seats ${seat.capacity}`);
    }

    return { seat, score, reasons };
  });

  ranked.sort((a, b) => b.score - a.score || a.seat.seatId.localeCompare(b.seat.seatId));
  return ranked.slice(0, 3);
}

export interface ClaimSeatResult {
  ok: boolean;
  conflict?: boolean;
  error?: string;
  visit?: Visit;
  seat?: Seat;
  alternatives?: SeatRecommendation[];
}

/**
 * Atomic seat claiming (PRD FR-103): prevents double booking under concurrency.
 */
export async function claimSeatAtomic(
  visitId: string,
  seatId: string
): Promise<ClaimSeatResult> {
  const nowIso = new Date().toISOString();

  if (!isFirestoreEnabled()) {
    const state = getMemoryState();
    const visit = state.visits.get(visitId);
    if (!visit || visit.currentMode === "ENDED") {
      return { ok: false, error: "Active visit not found." };
    }
    const target = state.seats.get(seatId);
    if (!target || target.cafeId !== visit.cafeId) {
      return { ok: false, error: "Seat not found in this café." };
    }
    if (target.zone === "GROUP") {
      return {
        ok: false,
        error: "Group tables are managed through Coffee Circles.",
      };
    }

    // Already claimed by this exact visit -> idempotent success
    if (target.status === "OCCUPIED" && target.claimedByVisitId === visit.visitId) {
      return { ok: true, visit, seat: target };
    }

    if (target.status !== "AVAILABLE") {
      const allSeats = await listSeats(visit.cafeId);
      return {
        ok: false,
        conflict: true,
        error: `Seat ${seatId} was just taken. Here are the best available alternatives.`,
        alternatives: rankAvailableSeats(allSeats, visit.spacePreferences),
      };
    }

    // Release previously claimed seat if switching seats
    if (visit.seatId && visit.seatId !== seatId) {
      const prev = state.seats.get(visit.seatId);
      if (prev && prev.claimedByVisitId === visit.visitId) {
        state.seats.set(prev.seatId, {
          ...prev,
          status: "AVAILABLE",
          claimedByVisitId: null,
          version: prev.version + 1,
          updatedAt: nowIso,
        });
      }
    }

    const updatedSeat: Seat = {
      ...target,
      status: "OCCUPIED",
      claimedByVisitId: visit.visitId,
      version: target.version + 1,
      updatedAt: nowIso,
    };
    state.seats.set(seatId, updatedSeat);

    const updatedVisit: Visit = {
      ...visit,
      seatId,
      currentMode:
        visit.currentMode === "PLANNING" && visit.intents.includes("FOCUS")
          ? "FOCUSING"
          : visit.currentMode === "PLANNING"
            ? "AVAILABLE"
            : visit.currentMode,
      focusUntil:
        visit.currentMode === "PLANNING" &&
        visit.intents.includes("FOCUS") &&
        visit.focusDurationMinutes
          ? new Date(Date.now() + visit.focusDurationMinutes * 60_000).toISOString()
          : visit.focusUntil,
      version: visit.version + 1,
      updatedAt: nowIso,
    };
    state.visits.set(visit.visitId, updatedVisit);

    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: visit.cafeId,
      type: "SEAT_CHANGED",
      entityId: seatId,
      version: updatedSeat.version,
      summary: `Seat ${seatId} confirmed for visit ${visit.visitId}.`,
      occurredAt: nowIso,
    });

    return { ok: true, visit: updatedVisit, seat: updatedSeat };
  }

  // Cloud Firestore atomic transaction
  const db = await getFirestoreDb();
  try {
    const result = await db.runTransaction(async (tx) => {
      const visitRef = db.collection("visits").doc(visitId);
      const seatRef = db.collection("seats").doc(seatId);
      const [visitSnap, seatSnap] = await Promise.all([
        tx.get(visitRef),
        tx.get(seatRef),
      ]);

      if (!visitSnap.exists) return { ok: false as const, error: "Active visit not found." };
      const visit = visitSnap.data() as Visit;
      if (visit.currentMode === "ENDED") {
        return { ok: false as const, error: "Visit has ended." };
      }
      if (!seatSnap.exists) return { ok: false as const, error: "Seat not found." };
      const target = seatSnap.data() as Seat;

      if (target.status === "OCCUPIED" && target.claimedByVisitId === visit.visitId) {
        return { ok: true as const, visit, seat: target };
      }
      if (target.status !== "AVAILABLE") {
        return { ok: false as const, conflict: true, visit };
      }

      if (visit.seatId && visit.seatId !== seatId) {
        const prevRef = db.collection("seats").doc(visit.seatId);
        const prevSnap = await tx.get(prevRef);
        if (prevSnap.exists) {
          const prev = prevSnap.data() as Seat;
          if (prev.claimedByVisitId === visit.visitId) {
            tx.set(
              prevRef,
              {
                status: "AVAILABLE",
                claimedByVisitId: null,
                version: prev.version + 1,
                updatedAt: nowIso,
              },
              { merge: true }
            );
          }
        }
      }

      const updatedSeat: Seat = {
        ...target,
        status: "OCCUPIED",
        claimedByVisitId: visit.visitId,
        version: target.version + 1,
        updatedAt: nowIso,
      };
      const updatedVisit: Visit = {
        ...visit,
        seatId,
        currentMode:
          visit.currentMode === "PLANNING" && visit.intents.includes("FOCUS")
            ? "FOCUSING"
            : visit.currentMode === "PLANNING"
              ? "AVAILABLE"
              : visit.currentMode,
        focusUntil:
          visit.currentMode === "PLANNING" &&
          visit.intents.includes("FOCUS") &&
          visit.focusDurationMinutes
            ? new Date(Date.now() + visit.focusDurationMinutes * 60_000).toISOString()
            : visit.focusUntil,
        version: visit.version + 1,
        updatedAt: nowIso,
      };

      tx.set(seatRef, updatedSeat, { merge: true });
      tx.set(visitRef, updatedVisit, { merge: true });
      return { ok: true as const, visit: updatedVisit, seat: updatedSeat };
    });

    if (!result.ok && result.conflict && result.visit) {
      const allSeats = await listSeats(result.visit.cafeId);
      return {
        ok: false,
        conflict: true,
        error: `Seat ${seatId} was just taken. Here are the best available alternatives.`,
        alternatives: rankAvailableSeats(allSeats, result.visit.spacePreferences),
      };
    }

    if (result.ok) {
      await recordEvent({
        eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
        cafeId: result.visit.cafeId,
        type: "SEAT_CHANGED",
        entityId: seatId,
        version: result.seat.version,
        summary: `Seat ${seatId} confirmed.`,
        occurredAt: nowIso,
      });
    }

    return result;
  } catch {
    return { ok: false, error: "Could not confirm seat due to a concurrent update. Please retry." };
  }
}

export async function updateFocusState(
  visitId: string,
  action: "start" | "extend" | "finish",
  minutes = 30
): Promise<Visit | null> {
  const visit = await getVisitById(visitId);
  if (!visit || visit.currentMode === "ENDED") return null;

  const now = new Date();
  const nowIso = now.toISOString();
  let updated: Visit;

  if (action === "finish") {
    const departure =
      visit.plannedDepartureAt ??
      new Date(now.getTime() + 120 * 60_000).toISOString();
    updated = {
      ...visit,
      currentMode: "AVAILABLE",
      focusUntil: null,
      availabilityWindows: [{ startAt: nowIso, endAt: departure }],
      version: visit.version + 1,
      updatedAt: nowIso,
    };
    await saveVisit(updated);
    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: visit.cafeId,
      type: "FOCUS_ENDED",
      entityId: visit.visitId,
      version: updated.version,
      summary: `Focus session finished; visit is now AVAILABLE.`,
      occurredAt: nowIso,
    });
    return updated;
  }

  const baseTime =
    action === "extend" && visit.focusUntil && new Date(visit.focusUntil).getTime() > now.getTime()
      ? new Date(visit.focusUntil).getTime()
      : now.getTime();
  const safeMins = Math.max(10, Math.min(180, Math.round(minutes)));
  const focusUntil = new Date(baseTime + safeMins * 60_000).toISOString();
  const departure =
    visit.plannedDepartureAt &&
    new Date(visit.plannedDepartureAt).getTime() > new Date(focusUntil).getTime()
      ? visit.plannedDepartureAt
      : new Date(new Date(focusUntil).getTime() + 60 * 60_000).toISOString();

  updated = {
    ...visit,
    currentMode: "FOCUSING",
    focusDurationMinutes: safeMins,
    focusUntil,
    availabilityWindows: [{ startAt: focusUntil, endAt: departure }],
    version: visit.version + 1,
    updatedAt: nowIso,
  };
  await saveVisit(updated);
  await recordEvent({
    eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
    cafeId: visit.cafeId,
    type: "FOCUS_STARTED",
    entityId: visit.visitId,
    version: updated.version,
    summary: `Focus session active until ${focusUntil}.`,
    occurredAt: nowIso,
  });

  // Also ensure seat stays intact if set
  if (visit.seatId) {
    const seat = await getSeat(visit.seatId);
    if (seat && seat.status === "AVAILABLE") {
      await saveSeat({
        ...seat,
        status: "OCCUPIED",
        claimedByVisitId: visit.visitId,
        version: seat.version + 1,
        updatedAt: nowIso,
      });
    }
  }

  return updated;
}
