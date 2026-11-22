import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { respondToMatch } from "@/lib/services/connect";
import { getActiveVisitForUser } from "@/lib/store";

const RespondSchema = z
  .object({
    decision: z.enum(["ACCEPT", "DECLINE", "CANCEL", "COMPLETE"]),
  })
  .strict();

export async function POST(
  request: Request,
  context: { params: { matchId: string } }
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
    const parsed = RespondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    const result = await respondToMatch(
      visit,
      context.params.matchId,
      parsed.data.decision
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ match: result.match });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
