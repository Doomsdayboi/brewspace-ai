import crypto from "crypto";
import {
  getSeat,
  getVisitById,
  listMatchesForUser,
  recordEvent,
  saveMatch,
  saveSeat,
  saveVisit,
} from "../store";
import { respondToCircle } from "./circles";
import type { Visit } from "../types";

/**
 * Ends an active visit cleanly (PRD FR-401, IA S05/X01):
 * - Transitions currentMode -> ENDED
 * - Releases claimed seat
 * - Withdraws pending/active matches and circle RSVPs
 */
export async function endVisitAtomic(visitId: string): Promise<Visit | null> {
  const visit = await getVisitById(visitId);
  if (!visit) return null;
  if (visit.currentMode === "ENDED") return visit;

  const nowIso = new Date().toISOString();

  // 1. Release claimed seat
  if (visit.seatId) {
    const seat = await getSeat(visit.seatId);
    if (seat && seat.claimedByVisitId === visit.visitId) {
      await saveSeat({
        ...seat,
        status: "AVAILABLE",
        claimedByVisitId: null,
        version: seat.version + 1,
        updatedAt: nowIso,
      });
    }
  }

  // 2. Leave active circle if any (releases group table if quorum drops)
  if (visit.activeCircleId) {
    await respondToCircle(visit, visit.activeCircleId, "LEAVE");
  }

  // 3. Cancel pending/active matches
  const matches = await listMatchesForUser(visit.cafeId, visit.userId);
  for (const m of matches) {
    if (
      m.status === "PROPOSED" ||
      m.status === "PENDING_OTHER" ||
      m.status === "MUTUALLY_CONFIRMED"
    ) {
      await saveMatch({
        ...m,
        status: "CANCELED",
        meetupInstructions: null,
        version: m.version + 1,
      });
    }
  }

  const ended: Visit = {
    ...visit,
    currentMode: "ENDED",
    seatId: null,
    activeMatchId: null,
    activeCircleId: null,
    connectOptIn: false,
    circlesOptIn: false,
    focusUntil: null,
    version: visit.version + 1,
    updatedAt: nowIso,
  };

  await saveVisit(ended);
  await recordEvent({
    eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
    cafeId: visit.cafeId,
    type: "VISIT_ENDED",
    entityId: visit.visitId,
    version: ended.version,
    summary: `Visit ${visit.visitId} ended and holds released.`,
    occurredAt: nowIso,
  });

  return ended;
}
