import { NextResponse } from "next/server";
import { getCafe, listSeats } from "@/lib/store";

export async function GET(
  _req: Request,
  context: { params: { cafeId: string } }
) {
  const cafeId = context.params.cafeId;
  if (!/^[a-z0-9-]{2,64}$/.test(cafeId)) {
    return NextResponse.json(
      { error: "This café link isn't available." },
      { status: 400 }
    );
  }

  const cafe = await getCafe(cafeId);
  if (!cafe) {
    return NextResponse.json(
      { error: "This café link isn't available." },
      { status: 404 }
    );
  }

  const seats = await listSeats(cafeId);
  const availableCount = seats.filter((s) => s.status === "AVAILABLE").length;

  return NextResponse.json({
    cafe,
    seatSummary: {
      total: seats.length,
      available: availableCount,
    },
  });
}
