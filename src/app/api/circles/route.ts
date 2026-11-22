import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { listCirclesForVisit } from "@/lib/services/circles";
import { getActiveVisitForUser } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const visit = await getActiveVisitForUser(user.userId);
  if (!visit) {
    return NextResponse.json({ error: "No active visit." }, { status: 404 });
  }

  const circles = await listCirclesForVisit(visit);
  return NextResponse.json({
    visit,
    circlesOptIn: visit.circlesOptIn,
    circles,
  });
}
