import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import {
  createMatchProposal,
  getConnectSuggestions,
  listSanitizedMatches,
} from "@/lib/services/connect";
import { getActiveVisitForUser } from "@/lib/store";

const ProposeSchema = z
  .object({
    candidateRef: z.string().min(3).max(80),
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

  const [suggestions, matches] = await Promise.all([
    getConnectSuggestions(visit),
    listSanitizedMatches(visit),
  ]);

  return NextResponse.json({
    visit,
    suppressedReason: suggestions.suppressedReason ?? null,
    candidates: suggestions.candidates,
    matches,
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
    const parsed = ProposeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid candidate reference." },
        { status: 400 }
      );
    }

    const result = await createMatchProposal(visit, parsed.data.candidateRef);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ match: result.match }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
