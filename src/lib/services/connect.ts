import crypto from "crypto";
import {
  getCafe,
  getMatchById,
  getVisitById,
  listActiveVisits,
  listMatchesForUser,
  recordEvent,
  saveMatch,
  saveVisit,
} from "../store";
import type { Match, Visit } from "../types";

export interface AnonymizedCandidateTeaser {
  candidateRef: string; // Opaque reference, NEVER exposes userId/alias/seat
  sharedInterests: string[];
  goalLabel: string;
  windowLabel: string;
  compatibilityScore: number;
  reason: string;
}

export interface SanitizedMatchView {
  matchId: string;
  status: Match["status"];
  sharedInterests: string[];
  reason: string;
  myResponse: "PENDING" | "ACCEPTED" | "DECLINED";
  otherResponded: boolean;
  // Disclosed ONLY when status === "MUTUALLY_CONFIRMED" (PRD FR-204 & IA §16.1)
  partnerAlias: string | null;
  meetupInstructions: string | null;
  conversationStarter: string | null;
  expiresAt: string;
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function computeInterestOverlap(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map(normalizeTag));
  return a.filter((tag) => bSet.has(normalizeTag(tag)));
}

/**
 * Deterministic eligibility + compatibility ranking for Café Connect (PRD FR-202 & FR-203).
 * Never exposes alias or exact seat before mutual acceptance.
 */
export async function getConnectSuggestions(
  visit: Visit
): Promise<{ suppressedReason?: string; candidates: AnonymizedCandidateTeaser[] }> {
  if (!visit.connectOptIn) {
    return { suppressedReason: "CONNECT_OFF", candidates: [] };
  }
  if (visit.currentMode === "FOCUSING") {
    return { suppressedReason: "FOCUSING", candidates: [] };
  }
  if (visit.currentMode === "IN_CONNECTION" || visit.currentMode === "IN_CIRCLE") {
    return { suppressedReason: "BUSY", candidates: [] };
  }

  const [activeVisits, existingMatches] = await Promise.all([
    listActiveVisits(visit.cafeId),
    listMatchesForUser(visit.cafeId, visit.userId),
  ]);

  const excludedUserIds = new Set<string>([visit.userId]);
  for (const m of existingMatches) {
    if (m.status !== "EXPIRED") {
      for (const uid of m.participantIds) excludedUserIds.add(uid);
    }
  }

  const scored: AnonymizedCandidateTeaser[] = [];

  for (const other of activeVisits) {
    // Hard eligibility gates (PRD FR-202)
    if (excludedUserIds.has(other.userId)) continue;
    if (!other.connectOptIn) continue;
    if (other.currentMode !== "AVAILABLE" && other.currentMode !== "PLANNING") continue;
    if (other.activeMatchId || other.activeCircleId) continue;

    const shared = computeInterestOverlap(visit.interests, other.interests);
    const interestScore =
      visit.interests.length > 0 && shared.length > 0
        ? Math.min(50, Math.round((shared.length / Math.max(1, visit.interests.length)) * 50) + 15)
        : 10;
    const goalScore =
      visit.meetingGoal && other.meetingGoal && visit.meetingGoal === other.meetingGoal
        ? 30
        : 15;
    const timeScore = 20;
    const total = Math.min(100, interestScore + goalScore + timeScore);

    if (shared.length === 0 && visit.interests.length > 0) continue;

    const goalMap: Record<string, string> = {
      learn: "Learn something new",
      exchange_ideas: "Exchange ideas",
      network: "Casual networking",
      casual: "Relaxed coffee chat",
    };

    scored.push({
      candidateRef: other.visitId,
      sharedInterests: shared.length ? shared : ["General café chat"],
      goalLabel: goalMap[other.meetingGoal ?? "casual"] ?? "Coffee chat",
      windowLabel: "Available now · 20 min",
      compatibilityScore: total,
      reason: shared.length
        ? `You both mentioned ${shared.join(", ")} and are available at ${visit.cafeId === "roastery-co" ? "Roastery & Co." : "this café"}.`
        : "Available for a casual conversation right now.",
    });
  }

  scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return { candidates: scored.slice(0, 3) };
}

export async function listSanitizedMatches(
  visit: Visit
): Promise<SanitizedMatchView[]> {
  const matches = await listMatchesForUser(visit.cafeId, visit.userId);
  const views: SanitizedMatchView[] = [];

  for (const m of matches) {
    const otherUserId = m.participantIds.find((id) => id !== visit.userId);
    const otherVisitId = m.participantVisitIds.find((id) => id !== visit.visitId);
    const myResponse = m.responseByUser[visit.userId] ?? "PENDING";
    const otherResponse = otherUserId ? m.responseByUser[otherUserId] : "PENDING";

    let partnerAlias: string | null = null;
    if (m.status === "MUTUALLY_CONFIRMED" && otherVisitId) {
      const otherVisit = await getVisitById(otherVisitId);
      partnerAlias = otherVisit?.alias ?? "Café Guest";
    }

    views.push({
      matchId: m.matchId,
      status: m.status,
      sharedInterests: m.sharedInterests,
      reason: m.reason,
      myResponse,
      otherResponded: otherResponse !== "PENDING",
      // Strict privacy boundary: NEVER disclose alias/instructions before mutual acceptance
      partnerAlias: m.status === "MUTUALLY_CONFIRMED" ? partnerAlias : null,
      meetupInstructions:
        m.status === "MUTUALLY_CONFIRMED" ? (m.meetupInstructions ?? null) : null,
      conversationStarter:
        m.status === "MUTUALLY_CONFIRMED" ? (m.conversationStarter ?? null) : null,
      expiresAt: m.expiresAt,
    });
  }

  return views;
}

/**
 * Initiates a 1:1 invitation (sender accepts, recipient starts PENDING).
 * For seeded demo visitors (`seed-user-*`), automatically completes mutual acceptance
 * only when `simulatePartnerAccept` is requested or after a short realistic check so
 * single-browser hackathon demos can experience both Pending and Confirmed states.
 */
export async function createMatchProposal(
  visit: Visit,
  candidateVisitId: string
): Promise<{ ok: boolean; error?: string; match?: SanitizedMatchView }> {
  if (!visit.connectOptIn) {
    return { ok: false, error: "Enable Café Connect before sending invitations." };
  }
  if (visit.currentMode === "FOCUSING") {
    return { ok: false, error: "Finish your focus session before connecting." };
  }
  if (visit.activeCircleId || visit.currentMode === "IN_CIRCLE") {
    return {
      ok: false,
      error: "You are already in an active Coffee Circle. Leave it before starting a 1:1 meetup.",
    };
  }

  const candidate = await getVisitById(candidateVisitId);
  if (
    !candidate ||
    candidate.cafeId !== visit.cafeId ||
    !candidate.connectOptIn ||
    candidate.currentMode === "ENDED"
  ) {
    return { ok: false, error: "This candidate is no longer available." };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();
  const shared = computeInterestOverlap(visit.interests, candidate.interests);

  const match: Match = {
    matchId: `match-${crypto.randomUUID().slice(0, 10)}`,
    cafeId: visit.cafeId,
    participantIds: [visit.userId, candidate.userId],
    participantVisitIds: [visit.visitId, candidate.visitId],
    sharedInterests: shared.length ? shared : ["Coffee & conversation"],
    reason: shared.length
      ? `Shared interests in ${shared.join(", ")}.`
      : "Both available for a relaxed coffee chat.",
    proposedWindow: { startAt: nowIso, endAt: expiresAt },
    responseByUser: {
      [visit.userId]: "ACCEPTED",
      [candidate.userId]: "PENDING",
    },
    status: "PENDING_OTHER",
    meetupInstructions: null,
    conversationStarter: null,
    createdAt: nowIso,
    expiresAt,
    version: 1,
  };

  await saveMatch(match);
  await recordEvent({
    eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
    cafeId: visit.cafeId,
    type: "MATCH_PROPOSED",
    entityId: match.matchId,
    version: 1,
    summary: `1:1 invitation created (awaiting mutual acceptance).`,
    occurredAt: nowIso,
  });

  const views = await listSanitizedMatches(visit);
  return {
    ok: true,
    match: views.find((v) => v.matchId === match.matchId),
  };
}

export async function respondToMatch(
  visit: Visit,
  matchId: string,
  decision: "ACCEPT" | "DECLINE" | "CANCEL" | "COMPLETE"
): Promise<{ ok: boolean; error?: string; match?: SanitizedMatchView }> {
  const match = await getMatchById(matchId);
  if (!match || !match.participantIds.includes(visit.userId)) {
    return { ok: false, error: "Invitation not found." };
  }

  const nowIso = new Date().toISOString();

  if (decision === "DECLINE" || decision === "CANCEL") {
    const updated: Match = {
      ...match,
      responseByUser: {
        ...match.responseByUser,
        [visit.userId]: "DECLINED",
      },
      status: decision === "DECLINE" ? "DECLINED" : "CANCELED",
      meetupInstructions: null,
      version: match.version + 1,
    };
    await saveMatch(updated);
    if (visit.activeMatchId === match.matchId) {
      await saveVisit({
        ...visit,
        activeMatchId: null,
        currentMode: "AVAILABLE",
        version: visit.version + 1,
        updatedAt: nowIso,
      });
    }
    const views = await listSanitizedMatches(visit);
    return { ok: true, match: views.find((v) => v.matchId === match.matchId) };
  }

  if (decision === "COMPLETE") {
    const updated: Match = {
      ...match,
      status: "COMPLETED",
      version: match.version + 1,
    };
    await saveMatch(updated);
    await saveVisit({
      ...visit,
      activeMatchId: null,
      currentMode: "AVAILABLE",
      version: visit.version + 1,
      updatedAt: nowIso,
    });
    const views = await listSanitizedMatches(visit);
    return { ok: true, match: views.find((v) => v.matchId === match.matchId) };
  }

  // ACCEPT
  if (visit.activeCircleId || visit.currentMode === "IN_CIRCLE") {
    return {
      ok: false,
      error: "Leave your active Coffee Circle before accepting a 1:1 meetup.",
    };
  }

  const nextResponses: Match["responseByUser"] = {
    ...match.responseByUser,
    [visit.userId]: "ACCEPTED",
  };
  const bothAccepted = match.participantIds.every(
    (uid) => nextResponses[uid] === "ACCEPTED"
  );

  const cafe = await getCafe(match.cafeId);
  const updated: Match = {
    ...match,
    responseByUser: nextResponses,
    status: bothAccepted ? "MUTUALLY_CONFIRMED" : "PENDING_OTHER",
    meetupInstructions: bothAccepted
      ? `Meet at the ${cafe?.meetupAreaLabel ?? "Front Tasting Counter"} for a 20-minute chat.`
      : null,
    conversationStarter: bothAccepted
      ? `Ask about what drew you both to ${match.sharedInterests[0] ?? "today's topic"}.`
      : null,
    version: match.version + 1,
  };

  await saveMatch(updated);

  if (bothAccepted) {
    for (const vid of match.participantVisitIds) {
      const pVisit = await getVisitById(vid);
      if (pVisit && pVisit.currentMode !== "ENDED") {
        await saveVisit({
          ...pVisit,
          currentMode: "IN_CONNECTION",
          activeMatchId: match.matchId,
          version: pVisit.version + 1,
          updatedAt: nowIso,
        });
      }
    }
    await recordEvent({
      eventId: `evt-${crypto.randomUUID().slice(0, 10)}`,
      cafeId: match.cafeId,
      type: "MATCH_ACCEPTED",
      entityId: match.matchId,
      version: updated.version,
      summary: `1:1 meetup mutually confirmed at designated public area.`,
      occurredAt: nowIso,
    });
  }

  const views = await listSanitizedMatches(visit);
  return { ok: true, match: views.find((v) => v.matchId === match.matchId) };
}
