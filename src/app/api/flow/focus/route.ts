import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { updateFocusState } from "@/lib/services/flow";
import { getActiveVisitForUser } from "@/lib/store";

const FocusBodySchema = z
  .object({
    action: z.enum(["start", "extend", "finish"]),
    minutes: z.number().int().min(10).max(180).optional(),
  })
  .strict();

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
    const parsed = FocusBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid focus action." },
        { status: 400 }
      );
    }

    const updated = await updateFocusState(
      visit.visitId,
      parsed.data.action,
      parsed.data.minutes ?? visit.focusDurationMinutes ?? 30
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Could not update focus state." },
        { status: 400 }
      );
    }

    return NextResponse.json({ visit: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
