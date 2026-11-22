import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionUser,
  setSessionCookie,
} from "@/lib/auth-server";
import { sanitizeText, SessionCreateSchema } from "@/lib/schemas";
import { getActiveVisitForUser } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, activeVisit: null });
  }
  const activeVisit = await getActiveVisitForUser(user.userId);
  return NextResponse.json({
    authenticated: true,
    user,
    activeVisit,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SessionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid display alias (1–32 characters)." },
        { status: 400 }
      );
    }

    const existing = await getSessionUser(request);
    const alias = sanitizeText(parsed.data.alias, 32);
    const user = {
      userId: existing?.userId ?? `guest-${crypto.randomUUID().slice(0, 12)}`,
      alias,
      role: existing?.role ?? ("visitor" as const),
    };

    setSessionCookie(user);
    const activeVisit = await getActiveVisitForUser(user.userId);

    return NextResponse.json({ user, activeVisit }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
