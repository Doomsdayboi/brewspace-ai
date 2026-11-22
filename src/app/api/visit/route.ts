import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { CreateVisitSchema, sanitizeText, UpdateVisitSchema } from "@/lib/schemas";
import {
  getActiveVisitForUser,
  getCafe,
  recordEvent,
  saveVisit,
} from "@/lib/store";
import type { Visit } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const visit = await getActiveVisitForUser(user.userId);
  return NextResponse.json({ visit, user });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateVisitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid visit configuration.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cafe = await getCafe(parsed.data.cafeId);
    if (!cafe) {
      return NextResponse.json(
        { error: "This café link isn't available." },
        { status: 404 }
      );
    }

    // PRD §5: At most one active visit per café; update existing active visit if present
    const existing = await getActiveVisitForUser(user.userId, cafe.cafeId);
    const now = new Date();
    const nowIso = now.toISOString();
    const stayMinutes = parsed.data.totalStayMinutes ?? cafe.visitExpiryMinutes;
    const expiresAt = new Date(
      now.getTime() + cafe.visitExpiryMinutes * 60_000
    ).toISOString();
    const plannedDepartureAt = new Date(
      now.getTime() + stayMinutes * 60_000
    ).toISOString();

    const focusMins = parsed.data.focusDurationMinutes ?? null;
    const availabilityStart = focusMins
      ? new Date(now.getTime() + focusMins * 60_000).toISOString()
      : nowIso;

    const visit: Visit = {
      visitId: existing?.visitId ?? `visit-${crypto.randomUUID().slice(0, 12)}`,
      cafeId: cafe.cafeId,
      userId: user.userId,
      alias: parsed.data.alias
        ? sanitizeText(parsed.data.alias, 32)
        : user.alias,
      startedAt: existing?.startedAt ?? nowIso,
      expiresAt,
      intents: parsed.data.intents,
      interests: parsed.data.interests.map((tag) => sanitizeText(tag, 40)),
      meetingGoal: parsed.data.meetingGoal,
      spacePreferences: parsed.data.spacePreferences,
      plannedDepartureAt,
      focusDurationMinutes: focusMins,
      focusUntil: existing?.focusUntil ?? null,
      availabilityWindows: [
        { startAt: availabilityStart, endAt: plannedDepartureAt },
      ],
      connectOptIn: parsed.data.connectOptIn,
      circlesOptIn: parsed.data.circlesOptIn,
      currentMode: existing?.currentMode ?? "PLANNING",
      seatId: existing?.seatId ?? null,
      activeMatchId: existing?.activeMatchId ?? null,
      activeCircleId: existing?.activeCircleId ?? null,
      proactiveMuted: existing?.proactiveMuted ?? false,
      version: (existing?.version ?? 0) + 1,
      updatedAt: nowIso,
    };

    await saveVisit(visit);
    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: cafe.cafeId,
      type: existing ? "INTENT_UPDATED" : "VISIT_STARTED",
      entityId: visit.visitId,
      version: visit.version,
      summary: existing
        ? `Visit ${visit.visitId} updated preferences.`
        : `New visit started at ${cafe.name}.`,
      occurredAt: nowIso,
    });

    return NextResponse.json({ visit }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getActiveVisitForUser(user.userId);
  if (!existing) {
    return NextResponse.json(
      { error: "No active visit found." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateVisitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const updated: Visit = {
      ...existing,
      ...parsed.data,
      interests: parsed.data.interests
        ? parsed.data.interests.map((t) => sanitizeText(t, 40))
        : existing.interests,
      version: existing.version + 1,
      updatedAt: nowIso,
    };

    await saveVisit(updated);
    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: updated.cafeId,
      type: "INTENT_UPDATED",
      entityId: updated.visitId,
      version: updated.version,
      summary: `Visit ${updated.visitId} preferences or consent updated.`,
      occurredAt: nowIso,
    });

    return NextResponse.json({ visit: updated });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
