import crypto from "crypto";
import {
  getCircleById,
  getSeat,
  getVisitById,
  listCircles,
  listSeats,
  recordEvent,
  saveCircle,
  saveRsvp,
  saveSeat,
  saveVisit,
} from "../store";
import type { Circle, Seat, Visit } from "../types";

export interface CircleView extends Circle {
  myRsvpStatus: "ACCEPTED" | "NONE";
  participantCount: number;
  spotsLeft: number;
  // Hide confirmed table ID if user is not a confirmed participant (IA §16.1)
  visibleTableLabel: string;
}

export async function listCirclesForVisit(visit: Visit): Promise<CircleView[]> {
  const circles = await listCircles(visit.cafeId);
  return circles
    .filter((c) => c.status !== "COMPLETED")
    .map((c) => {
      const isParticipant = c.participantUserIds.includes(visit.userId);
      const isConfirmed = c.status === "CONFIRMED" || c.status === "ACTIVE";
      return {
        ...c,
        myRsvpStatus: isParticipant ? "ACCEPTED" : "NONE",
        participantCount: c.participantUserIds.length,
        spotsLeft: Math.max(0, c.maxParticipants - c.participantUserIds.length),
        visibleTableLabel:
          isConfirmed && isParticipant && c.seatId
            ? `Confirmed: Group Table ${c.seatId}`
            : c.generalArea,
      };
    });
}

async function findAvailableGroupTable(
  cafeId: string,
  minCapacity: number,
  excludeSeatId?: string | null
): Promise<Seat | null> {
  const seats = await listSeats(cafeId);
  const candidates = seats
    .filter(
      (s) =>
        s.zone === "GROUP" &&
        s.status === "AVAILABLE" &&
        s.capacity >= minCapacity &&
        s.seatId !== excludeSeatId
    )
    .sort((a, b) => a.capacity - b.capacity || a.seatId.localeCompare(b.seatId));
  return candidates[0] ?? null;
}

/**
 * Atomic Circle RSVP & Quorum + Group Table Activation (PRD FR-302, FR-303, FR-403).
 */
export async function respondToCircle(
  visit: Visit,
  circleId: string,
  decision: "JOIN" | "LEAVE"
): Promise<{ ok: boolean; error?: string; circle?: CircleView }> {
  const circle = await getCircleById(circleId);
  if (!circle || circle.cafeId !== visit.cafeId) {
    return { ok: false, error: "Coffee Circle not found." };
  }

  const nowIso = new Date().toISOString();

  if (decision === "JOIN") {
    if (!visit.circlesOptIn) {
      return { ok: false, error: "Enable Coffee Circles in Settings before joining." };
    }
    if (visit.activeMatchId || visit.currentMode === "IN_CONNECTION") {
      return {
        ok: false,
        error: "You already have a confirmed 1:1 meetup. Finish or cancel it before joining a circle.",
      };
    }
    if (visit.activeCircleId && visit.activeCircleId !== circleId) {
      return {
        ok: false,
        error: "You are already in another Coffee Circle.",
      };
    }
    if (circle.status === "CANCELED" || circle.status === "COMPLETED") {
      return { ok: false, error: "This Coffee Circle is no longer open." };
    }

    const alreadyIn = circle.participantUserIds.includes(visit.userId);
    if (!alreadyIn && circle.participantUserIds.length >= circle.maxParticipants) {
      return { ok: false, error: "This Coffee Circle is currently full." };
    }

    const nextParticipants = alreadyIn
      ? circle.participantUserIds
      : [...circle.participantUserIds, visit.userId];

    let nextStatus = circle.status;
    let nextSeatId = circle.seatId ?? null;
    let nextStatusNote = circle.statusNote ?? null;

    // Check quorum (>= minParticipants, default 3) and atomically hold a GROUP table
    if (nextParticipants.length >= circle.minParticipants) {
      if (!nextSeatId) {
        const groupTable = await findAvailableGroupTable(
          circle.cafeId,
          Math.max(3, nextParticipants.length)
        );
        if (groupTable) {
          await saveSeat({
            ...groupTable,
            status: "HELD_FOR_CIRCLE",
            heldByCircleId: circle.circleId,
            version: groupTable.version + 1,
            updatedAt: nowIso,
          });
          nextSeatId = groupTable.seatId;
          nextStatus = "CONFIRMED";
          nextStatusNote = `Quorum reached (${nextParticipants.length}/${circle.maxParticipants}) and Group Table ${groupTable.seatId} is held.`;
        } else {
          nextStatus = "AWAITING_CONFIRMATIONS";
          nextStatusNote =
            "Quorum reached, but no group table is currently available. We will confirm once a table opens.";
        }
      } else {
        nextStatus = "CONFIRMED";
        nextStatusNote = `Confirmed at Group Table ${nextSeatId} (${nextParticipants.length}/${circle.maxParticipants} confirmed).`;
      }
    } else {
      const remaining = circle.minParticipants - nextParticipants.length;
      nextStatus = "AWAITING_CONFIRMATIONS";
      nextStatusNote = `RSVP recorded. Needs ${remaining} more ${remaining === 1 ? "person" : "people"} to confirm and hold a table.`;
    }

    const updatedCircle: Circle = {
      ...circle,
      participantUserIds: nextParticipants,
      status: nextStatus,
      seatId: nextSeatId,
      statusNote: nextStatusNote,
      version: circle.version + 1,
      updatedAt: nowIso,
    };

    await saveCircle(updatedCircle);
    await saveRsvp({
      rsvpId: `${circle.circleId}__${visit.userId}`,
      circleId: circle.circleId,
      cafeId: circle.cafeId,
      userId: visit.userId,
      visitId: visit.visitId,
      status: "ACCEPTED",
      respondedAt: nowIso,
    });

    await saveVisit({
      ...visit,
      activeCircleId: circle.circleId,
      currentMode: nextStatus === "CONFIRMED" ? "IN_CIRCLE" : visit.currentMode,
      version: visit.version + 1,
      updatedAt: nowIso,
    });

    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: circle.cafeId,
      type: nextStatus === "CONFIRMED" ? "CIRCLE_CONFIRMED" : "CIRCLE_JOINED",
      entityId: circle.circleId,
      version: updatedCircle.version,
      summary:
        nextStatus === "CONFIRMED"
          ? `Coffee Circle "${circle.topic}" confirmed at table ${nextSeatId}.`
          : `RSVP added to "${circle.topic}" (${nextParticipants.length}/${circle.minParticipants} for quorum).`,
      occurredAt: nowIso,
    });

    const refreshed = await listCirclesForVisit({
      ...visit,
      activeCircleId: circle.circleId,
    });
    return { ok: true, circle: refreshed.find((c) => c.circleId === circle.circleId) };
  }

  // LEAVE
  const nextParticipants = circle.participantUserIds.filter(
    (uid) => uid !== visit.userId
  );
  let nextStatus = circle.status;
  let nextSeatId = circle.seatId ?? null;
  let nextStatusNote = circle.statusNote ?? null;

  if (nextParticipants.length < circle.minParticipants) {
    // Release held table if quorum is lost (PRD §15)
    if (nextSeatId) {
      const heldSeat = await getSeat(nextSeatId);
      if (heldSeat && heldSeat.heldByCircleId === circle.circleId) {
        await saveSeat({
          ...heldSeat,
          status: "AVAILABLE",
          heldByCircleId: null,
          version: heldSeat.version + 1,
          updatedAt: nowIso,
        });
      }
      nextSeatId = null;
    }
    nextStatus = "AWAITING_CONFIRMATIONS";
    const needed = circle.minParticipants - nextParticipants.length;
    nextStatusNote = `Needs ${needed} more ${needed === 1 ? "person" : "people"} to reach quorum.`;
  }

  const updatedCircle: Circle = {
    ...circle,
    participantUserIds: nextParticipants,
    status: nextStatus,
    seatId: nextSeatId,
    statusNote: nextStatusNote,
    version: circle.version + 1,
    updatedAt: nowIso,
  };
  await saveCircle(updatedCircle);
  await saveRsvp({
    rsvpId: `${circle.circleId}__${visit.userId}`,
    circleId: circle.circleId,
    cafeId: circle.cafeId,
    userId: visit.userId,
    visitId: visit.visitId,
    status: "CANCELED",
    respondedAt: nowIso,
  });

  if (visit.activeCircleId === circle.circleId) {
    await saveVisit({
      ...visit,
      activeCircleId: null,
      currentMode: visit.currentMode === "IN_CIRCLE" ? "AVAILABLE" : visit.currentMode,
      version: visit.version + 1,
      updatedAt: nowIso,
    });
  }

  const refreshed = await listCirclesForVisit({
    ...visit,
    activeCircleId: null,
  });
  return { ok: true, circle: refreshed.find((c) => c.circleId === circle.circleId) };
}

/**
 * Cross-module conflict resolution (PRD Journey D, FR-403 & IA J10):
 * When a staff member marks a circle's group table unavailable/occupied,
 * atomically relocate to another compatible GROUP table or cancel cleanly.
 */
export async function handleGroupTableConflict(
  cafeId: string,
  affectedSeatId: string
): Promise<{
  relocated: boolean;
  canceled: boolean;
  circle?: Circle;
  newSeatId?: string | null;
}> {
  const circles = await listCircles(cafeId);
  const affected = circles.find(
    (c) =>
      c.seatId === affectedSeatId &&
      (c.status === "CONFIRMED" || c.status === "ACTIVE")
  );
  if (!affected) {
    return { relocated: false, canceled: false };
  }

  const nowIso = new Date().toISOString();
  const replacement = await findAvailableGroupTable(
    cafeId,
    Math.max(3, affected.participantUserIds.length),
    affectedSeatId
  );

  if (replacement) {
    await saveSeat({
      ...replacement,
      status: "HELD_FOR_CIRCLE",
      heldByCircleId: affected.circleId,
      version: replacement.version + 1,
      updatedAt: nowIso,
    });

    const updated: Circle = {
      ...affected,
      seatId: replacement.seatId,
      statusNote: `Table changed: ${affectedSeatId} became unavailable, so your circle moved to Group Table ${replacement.seatId}.`,
      version: affected.version + 1,
      updatedAt: nowIso,
    };
    await saveCircle(updated);
    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId,
      type: "CIRCLE_RELOCATED",
      entityId: affected.circleId,
      version: updated.version,
      summary: `Circle "${affected.topic}" relocated from ${affectedSeatId} to ${replacement.seatId}.`,
      occurredAt: nowIso,
    });
    return {
      relocated: true,
      canceled: false,
      circle: updated,
      newSeatId: replacement.seatId,
    };
  }

  // No compatible group table available -> cancel cleanly, never place at occupied table
  const canceled: Circle = {
    ...affected,
    seatId: null,
    status: "CANCELED",
    statusNote: `Canceled: Group Table ${affectedSeatId} became unavailable and no alternative group table is free right now.`,
    version: affected.version + 1,
    updatedAt: nowIso,
  };
  await saveCircle(canceled);

  // Release participants from IN_CIRCLE mode
  for (const uid of affected.participantUserIds) {
    const pVisit = await getVisitById(`seed-visit-${uid.replace("seed-user-", "")}`);
    if (pVisit && pVisit.activeCircleId === affected.circleId) {
      await saveVisit({
        ...pVisit,
        activeCircleId: null,
        currentMode: "AVAILABLE",
        version: pVisit.version + 1,
        updatedAt: nowIso,
      });
    }
  }

  await recordEvent({
    eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
    cafeId,
    type: "CIRCLE_CANCELED",
    entityId: affected.circleId,
    version: canceled.version,
    summary: `Circle "${affected.topic}" canceled due to no alternative group table.`,
    occurredAt: nowIso,
  });

  return { relocated: false, canceled: true, circle: canceled, newSeatId: null };
}
