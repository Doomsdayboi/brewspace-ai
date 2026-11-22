import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { DEFAULT_CAFE_ID } from "@/lib/seed-data";
import {
  getCafe,
  listActiveVisits,
  listCircles,
  listEvents,
  listSeats,
} from "@/lib/store";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user || (user.role !== "staff" && user.role !== "demo_admin")) {
    return NextResponse.json(
      { error: "You don't have access to this café console." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const cafeId = url.searchParams.get("cafeId") || DEFAULT_CAFE_ID;
  const cafe = await getCafe(cafeId);
  if (!cafe) {
    return NextResponse.json({ error: "Café not found." }, { status: 404 });
  }

  const [seats, visits, circles, events] = await Promise.all([
    listSeats(cafeId),
    listActiveVisits(cafeId),
    listCircles(cafeId),
    listEvents(cafeId, 20),
  ]);

  const occupiedCount = seats.filter((s) => s.status !== "AVAILABLE").length;
  const activeFocusers = visits.filter((v) => v.currentMode === "FOCUSING").length;
  const confirmedCircles = circles.filter(
    (c) => c.status === "CONFIRMED" || c.status === "ACTIVE"
  ).length;

  // IA §16.1 Privacy Boundary: Staff sees operational counts & circle/seat states ONLY —
  // NEVER private customer interests, personal notes, or unaccepted match details.
  const operationalCircles = circles.map((c) => ({
    circleId: c.circleId,
    topic: c.topic,
    status: c.status,
    seatId: c.seatId ?? null,
    participantCount: c.participantUserIds.length,
    minParticipants: c.minParticipants,
    maxParticipants: c.maxParticipants,
    statusNote: c.statusNote ?? null,
    updatedAt: c.updatedAt,
  }));

  const operationalSeats = seats.map((s) => ({
    seatId: s.seatId,
    label: s.label,
    zone: s.zone,
    capacity: s.capacity,
    hasOutlet: s.hasOutlet,
    status: s.status,
    heldByCircleId: s.heldByCircleId ?? null,
    updatedAt: s.updatedAt,
  }));

  return NextResponse.json({
    cafe,
    role: user.role,
    kpis: {
      totalSeats: seats.length,
      occupiedSeats: occupiedCount,
      availableSeats: seats.length - occupiedCount,
      activeVisits: visits.length,
      activeFocusers,
      confirmedCircles,
    },
    seats: operationalSeats,
    circles: operationalCircles,
    events,
  });
}
