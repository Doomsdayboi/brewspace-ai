import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth-server";
import { sanitizeText } from "@/lib/schemas";
import { listCirclesForVisit } from "@/lib/services/circles";
import { getConnectSuggestions } from "@/lib/services/connect";
import { rankAvailableSeats } from "@/lib/services/flow";
import { getActiveVisitForUser, listSeats } from "@/lib/store";

const AssistantRequestSchema = z
  .object({
    message: z.string().min(1).max(400),
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
    const parsed = AssistantRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a short question (1–400 characters)." },
        { status: 400 }
      );
    }

    const msg = sanitizeText(parsed.data.message, 400);
    const lower = msg.toLowerCase();

    // Gather authoritative server state (AI never invents seats, people, or confirmations)
    const [seats, circles, connectResult] = await Promise.all([
      listSeats(visit.cafeId),
      listCirclesForVisit(visit),
      getConnectSuggestions(visit),
    ]);
    const topSeats = rankAvailableSeats(seats, visit.spacePreferences);

    // Deterministic grounded response & explicit next-step actions (PRD §9.4 & IA G01)
    const actions: Array<{ label: string; href: string }> = [];
    let reply = "";

    if (/\b(seat|table|quiet|outlet|power|spot|move)\b/.test(lower)) {
      if (topSeats.length > 0) {
        const best = topSeats[0];
        reply = `Right now, ${best.seat.label} (${best.seat.zone.toLowerCase()} zone) is available and fits your preferences (${best.reasons.join("; ")}). Nothing is claimed until you confirm it in My Space.`;
        actions.push({ label: "Open My Space", href: "/visit/space" });
      } else {
        reply =
          "No seats matching all of your current filters are open right now. You can view other zones in My Space.";
        actions.push({ label: "Browse all seats", href: "/visit/space" });
      }
    } else if (/\b(focus|extend|finish|timer|done working)\b/.test(lower)) {
      if (visit.currentMode === "FOCUSING") {
        reply =
          "You're currently in Focus mode with social notifications paused. You can finish early or extend your session from My Space or Today.";
        actions.push({ label: "Manage focus in My Space", href: "/visit/space" });
      } else {
        reply =
          "You're not in a focus session right now. Choose a seat in My Space to start a quiet focus timer.";
        actions.push({ label: "Open My Space", href: "/visit/space" });
      }
    } else if (/\b(connect|match|1:1|people|someone|meet)\b/.test(lower)) {
      if (!visit.connectOptIn) {
        reply =
          "Café Connect is currently off for your visit. You can enable 1:1 discovery anytime in Connect or Settings—nothing is shared until both people accept.";
        actions.push({ label: "Review Connect settings", href: "/visit/connect" });
      } else if (visit.currentMode === "FOCUSING") {
        reply =
          "You're focusing right now, so 1:1 suggestions are held until you finish focus.";
        actions.push({ label: "View focus controls", href: "/visit/space" });
      } else if (connectResult.candidates.length > 0) {
        reply = `There ${connectResult.candidates.length === 1 ? "is 1 eligible guest" : `are ${connectResult.candidates.length} eligible guests`} sharing your topics right now. Open Connect to review anonymized teasers.`;
        actions.push({ label: "Explore Connect", href: "/visit/connect" });
      } else {
        reply =
          "There are no eligible 1:1 matches right now. You can update your topics or check back shortly.";
        actions.push({ label: "Open Connect", href: "/visit/connect" });
      }
    } else if (/\b(circle|group|roundtable|discussion)\b/.test(lower)) {
      if (!visit.circlesOptIn) {
        reply =
          "Coffee Circles is currently off for your visit. You can opt in anytime on the Circles tab.";
        actions.push({ label: "Open Circles", href: "/visit/circles" });
      } else {
        const openCircles = circles.filter((c) => c.status !== "CANCELED");
        reply = openCircles.length
          ? `There are ${openCircles.length} Coffee Circles open at this café (including "${openCircles[0].topic}"). Joining sends an RSVP; confirmation happens once at least 3 people accept and a group table is held.`
          : "No Coffee Circles are currently open. Check back soon or update your interests.";
        actions.push({ label: "Browse Circles", href: "/visit/circles" });
      }
    } else {
      // General grounded summary
      const seatPart = visit.seatId
        ? `You have Seat ${visit.seatId} confirmed.`
        : topSeats[0]
          ? `Seat ${topSeats[0].seat.seatId} is currently available if you'd like to claim a spot.`
          : "You haven't confirmed a seat yet.";
      const modePart =
        visit.currentMode === "FOCUSING"
          ? "Focus mode is active and social prompts are paused."
          : `Your current mode is ${visit.currentMode}.`;
      reply = `${modePart} ${seatPart} You can ask about seats, focus time, 1:1 Connect, or Coffee Circles—or use the tabs directly.`;
      actions.push(
        { label: "My Space", href: "/visit/space" },
        { label: "Connect", href: "/visit/connect" },
        { label: "Circles", href: "/visit/circles" }
      );
    }

    return NextResponse.json({
      reply,
      actions,
      groundedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Assistant is temporarily unavailable. You can still use My Space, Connect, and Circles directly.",
      },
      { status: 500 }
    );
  }
}
