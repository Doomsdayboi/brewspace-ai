import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { DEFAULT_CAFE_ID } from "@/lib/seed-data";
import { handleGroupTableConflict } from "@/lib/services/circles";
import { respondToMatch } from "@/lib/services/connect";
import {
  getMemoryState,
  getSeat,
  getVisitById,
  isFirestoreEnabled,
  listCircles,
  resetMemoryState,
  saveSeat,
} from "@/lib/store";

const DemoActionSchema = z
  .object({
    action: z.enum([
      "reset",
      "accept_pending_matches",
      "trigger_table_conflict",
    ]),
    cafeId: z.string().default(DEFAULT_CAFE_ID),
  })
  .strict();

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user || user.role !== "demo_admin") {
    return NextResponse.json(
      { error: "Demo Simulator requires demo_admin authorization." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = DemoActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid demo action." }, { status: 400 });
    }

    const { action, cafeId } = parsed.data;

    if (action === "reset") {
      if (!isFirestoreEnabled()) {
        resetMemoryState();
      }
      return NextResponse.json({
        ok: true,
        summary: "Reset Roastery & Co. floor plan, 4 consenting demo visitors, and 2 circles.",
      });
    }

    if (action === "accept_pending_matches") {
      let acceptedCount = 0;
      if (!isFirestoreEnabled()) {
        const matches = Array.from(getMemoryState().matches.values()).filter(
          (m) => m.cafeId === cafeId && m.status === "PENDING_OTHER"
        );
        for (const m of matches) {
          const pendingUid = m.participantIds.find(
            (uid) => m.responseByUser[uid] === "PENDING"
          );
          const pendingVisitId = m.participantVisitIds.find((vid) =>
            pendingUid ? vid.includes(pendingUid.replace("seed-user-", "")) : false
          );
          if (pendingVisitId) {
            const partnerVisit = await getVisitById(pendingVisitId);
            if (partnerVisit) {
              const res = await respondToMatch(partnerVisit, m.matchId, "ACCEPT");
              if (res.ok) acceptedCount++;
            }
          }
        }
      }
      return NextResponse.json({
        ok: true,
        acceptedCount,
        summary:
          acceptedCount > 0
            ? `Simulated mutual acceptance for ${acceptedCount} pending 1:1 invitation(s).`
            : "No pending 1:1 invitations awaiting a seeded partner.",
      });
    }

    if (action === "trigger_table_conflict") {
      const circles = await listCircles(cafeId);
      const confirmed = circles.find(
        (c) => (c.status === "CONFIRMED" || c.status === "ACTIVE") && c.seatId
      );
      if (!confirmed || !confirmed.seatId) {
        return NextResponse.json(
          {
            error:
              "No confirmed Coffee Circle with a held table right now. Join 'AI Builders & Startup Ideas' as a guest first.",
          },
          { status: 400 }
        );
      }

      const oldSeatId = confirmed.seatId;
      const seat = await getSeat(oldSeatId);
      if (seat) {
        await saveSeat({
          ...seat,
          status: "OCCUPIED",
          heldByCircleId: null,
          version: seat.version + 1,
          updatedAt: new Date().toISOString(),
        });
      }

      const resolution = await handleGroupTableConflict(cafeId, oldSeatId);
      return NextResponse.json({
        ok: true,
        resolution,
        summary: resolution.relocated
          ? `Marked ${oldSeatId} occupied — relocated "${confirmed.topic}" to Group Table ${resolution.newSeatId}.`
          : `Marked ${oldSeatId} occupied — no alternative group table free, so "${confirmed.topic}" was cleanly canceled.`,
      });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
