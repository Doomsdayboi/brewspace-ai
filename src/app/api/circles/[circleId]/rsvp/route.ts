import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { respondToCircle } from "@/lib/services/circles";
import { getActiveVisitForUser } from "@/lib/store";

const RsvpSchema = z
  .object({
    decision: z.enum(["JOIN", "LEAVE"]),
  })
  .strict();

export async function POST(
  request: Request,
  context: { params: { circleId: string } }
) {
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
    const parsed = RsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid RSVP decision." }, { status: 400 });
    }

    const result = await respondToCircle(
      visit,
      context.params.circleId,
      parsed.data.decision
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ circle: result.circle });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
