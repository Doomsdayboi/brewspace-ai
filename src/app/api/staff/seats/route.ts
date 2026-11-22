import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { handleGroupTableConflict } from "@/lib/services/circles";
import { getSeat, recordEvent, saveSeat } from "@/lib/store";

const StaffSeatUpdateSchema = z
  .object({
    seatId: z.string().min(2).max(16),
    status: z.enum(["AVAILABLE", "OCCUPIED", "UNAVAILABLE"]),
  })
  .strict();

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user || (user.role !== "staff" && user.role !== "demo_admin")) {
    return NextResponse.json(
      { error: "You don't have access to this café console." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = StaffSeatUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid seat status update." },
        { status: 400 }
      );
    }

    const seat = await getSeat(parsed.data.seatId);
    if (!seat) {
      return NextResponse.json({ error: "Seat not found." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const wasHeldByCircle = Boolean(seat.heldByCircleId);

    const updatedSeat = await saveSeat({
      ...seat,
      status: parsed.data.status,
      claimedByVisitId:
        parsed.data.status === "AVAILABLE" ? null : seat.claimedByVisitId,
      heldByCircleId:
        parsed.data.status === "AVAILABLE" || parsed.data.status === "OCCUPIED" || parsed.data.status === "UNAVAILABLE"
          ? null
          : seat.heldByCircleId,
      version: seat.version + 1,
      updatedAt: nowIso,
    });

    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: seat.cafeId,
      type: "SEAT_CHANGED",
      entityId: seat.seatId,
      version: updatedSeat.version,
      summary: `Staff marked ${seat.seatId} as ${parsed.data.status}.`,
      occurredAt: nowIso,
    });

    // Cross-module orchestration (PRD FR-501 & Journey D):
    // If staff marks a circle's held group table occupied/unavailable, relocate or cancel cleanly.
    let conflictResolution = null;
    if (
      wasHeldByCircle &&
      (parsed.data.status === "OCCUPIED" || parsed.data.status === "UNAVAILABLE")
    ) {
      conflictResolution = await handleGroupTableConflict(
        seat.cafeId,
        seat.seatId
      );
    }

    return NextResponse.json({
      seat: updatedSeat,
      conflictResolution,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
