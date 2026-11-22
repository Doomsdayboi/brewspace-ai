import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { SeatZoneSchema } from "@/lib/schemas";
import { claimSeatAtomic, rankAvailableSeats } from "@/lib/services/flow";
import { getActiveVisitForUser, listSeats } from "@/lib/store";

const ClaimBodySchema = z
  .object({
    seatId: z.string().min(2).max(16),
  })
  .strict();

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const visit = await getActiveVisitForUser(user.userId);
  if (!visit) {
    return NextResponse.json({ error: "No active visit." }, { status: 404 });
  }

  const url = new URL(request.url);
  const zoneParam = url.searchParams.get("zone");
  const parsedZone = zoneParam ? SeatZoneSchema.safeParse(zoneParam) : null;
  const filterZone = parsedZone?.success ? parsedZone.data : undefined;

  const seats = await listSeats(visit.cafeId);
  const recommendations = rankAvailableSeats(
    seats,
    visit.spacePreferences,
    filterZone
  );

  // Strip claimedByVisitId from other visitors' seats (IA §16.1 privacy rule)
  const publicSeats = seats.map((s) => ({
    ...s,
    isMine: s.claimedByVisitId === visit.visitId,
    claimedByVisitId: undefined,
  }));

  return NextResponse.json({
    visit,
    recommendations,
    seats: publicSeats,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const visit = await getActiveVisitForUser(user.userId);
  if (!visit) {
    return NextResponse.json({ error: "No active visit." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = ClaimBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid seat ID." }, { status: 400 });
    }

    const result = await claimSeatAtomic(visit.visitId, parsed.data.seatId);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          conflict: Boolean(result.conflict),
          alternatives: result.alternatives ?? [],
        },
        { status: result.conflict ? 409 : 400 }
      );
    }

    return NextResponse.json({
      visit: result.visit,
      seat: result.seat,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
