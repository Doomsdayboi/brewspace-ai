import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { endVisitAtomic } from "@/lib/services/visit-lifecycle";
import { getActiveVisitForUser } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const visit = await getActiveVisitForUser(user.userId);
  if (!visit) {
    return NextResponse.json({ error: "No active visit." }, { status: 404 });
  }

  const ended = await endVisitAtomic(visit.visitId);
  return NextResponse.json({ visit: ended });
}
